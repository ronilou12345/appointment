const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"]

export const GOOGLE_STATE_COOKIE = "google_oauth_state"
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback"

export type GoogleProfile = {
  email: string
  emailVerified: boolean
  name: string
  picture: string
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())
}

function requireCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.")
  }

  return { clientId, clientSecret }
}

// `next dev -H 0.0.0.0` makes the request URL report 0.0.0.0 as the host, so the
// browser-facing origin has to come from the headers instead.
export function resolveOrigin(headers: Headers, fallbackOrigin: string) {
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim()

  if (!host) return fallbackOrigin

  const forwardedProtocol = headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const protocol = forwardedProtocol || new URL(fallbackOrigin).protocol.replace(":", "")

  return `${protocol}://${host}`
}

// Google matches this value literally against the console entry, so an explicit
// override is needed whenever the app is reached through a proxy or tunnel.
export function resolveRedirectUri(origin: string) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim()
  return configured || `${origin}${GOOGLE_CALLBACK_PATH}`
}

export function buildGoogleAuthUrl({ redirectUri, state }: { redirectUri: string; state: string }) {
  const { clientId } = requireCredentials()
  const url = new URL(GOOGLE_AUTH_ENDPOINT)

  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("access_type", "online")
  url.searchParams.set("prompt", "select_account")

  return url.toString()
}

function decodeIdToken(idToken: string) {
  const payload = idToken.split(".")[1]

  if (!payload) throw new Error("Google returned a malformed ID token.")

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
  const decoded = Buffer.from(normalized, "base64").toString("utf8")

  return JSON.parse(decoded) as Record<string, unknown>
}

export async function exchangeCodeForProfile({
  code,
  redirectUri,
}: {
  code: string
  redirectUri: string
}): Promise<GoogleProfile> {
  const { clientId, clientSecret } = requireCredentials()

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  })

  const token = (await response.json()) as { id_token?: string; error_description?: string; error?: string }

  if (!response.ok || !token.id_token) {
    throw new Error(token.error_description || token.error || "Google rejected the sign-in request.")
  }

  // The token came straight from Google over TLS using our client secret, so the
  // signature does not need re-checking; the claims below still do.
  const claims = decodeIdToken(token.id_token)
  const audience = String(claims.aud ?? "")
  const issuer = String(claims.iss ?? "")
  const expiry = Number(claims.exp ?? 0)

  if (audience !== clientId) throw new Error("Google ID token was issued for a different app.")
  if (!GOOGLE_ISSUERS.includes(issuer)) throw new Error("Google ID token has an unexpected issuer.")
  if (!expiry || expiry * 1000 <= Date.now()) throw new Error("Google ID token has expired.")

  return {
    email: String(claims.email ?? "").trim().toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: String(claims.name ?? "").trim(),
    picture: String(claims.picture ?? "").trim(),
  }
}
