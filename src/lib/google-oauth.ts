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

function readEnv(name: string) {
  // Dynamic lookup so Vercel can inject values at runtime. Static
  // `process.env.GOOGLE_CLIENT_ID` can be inlined as undefined at build time
  // if the variable was missing during the last production build.
  const value = process.env[name]
  return String(value ?? "").trim().replace(/^["']|["']$/g, "")
}

export function isGoogleOAuthConfigured() {
  return Boolean(readEnv("GOOGLE_CLIENT_ID") && readEnv("GOOGLE_CLIENT_SECRET"))
}

export function getGoogleEnvStatus() {
  const clientId = readEnv("GOOGLE_CLIENT_ID")
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET")

  return {
    configured: Boolean(clientId && clientSecret),
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    secretStartsWithGocspx: clientSecret.startsWith("GOCSPX-"),
  }
}

function requireCredentials() {
  const clientId = readEnv("GOOGLE_CLIENT_ID")
  // A leading digit is often pasted from a numbered console list (e.g. "8GOCSPX-...").
  const clientSecret = readEnv("GOOGLE_CLIENT_SECRET").replace(/^\d+(?=GOCSPX-)/, "")

  if (!clientId || !clientSecret) {
    throw new Error("Google sign-in is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.")
  }

  return { clientId, clientSecret }
}

const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1"]
const WILDCARD_HOSTNAMES = ["0.0.0.0", "::", "[::]"]

function hostnameOf(host: string) {
  return host.replace(/^\[|\]$/g, "").split(":")[0]
}

function isLoopbackHost(host: string) {
  const hostname = hostnameOf(host)
  return LOOPBACK_HOSTNAMES.includes(hostname) || WILDCARD_HOSTNAMES.includes(hostname)
}

// `next dev -H 0.0.0.0` makes the request URL report 0.0.0.0 as the host, so the
// browser-facing origin has to come from the headers instead.
export function resolveOrigin(headers: Headers, fallbackOrigin: string) {
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim()

  if (!host) return fallbackOrigin

  // Google rejects http redirect URIs except on localhost. Non-loopback hosts
  // (including *.vercel.app) must always use https, even if a proxy omits the header.
  const protocol = isLoopbackHost(host)
    ? "http"
    : headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https"

  return `${protocol}://${host}`
}

// `next dev -H 0.0.0.0` advertises a host Google refuses, so the browser is moved
// to the equivalent loopback address before the flow starts. 127.0.0.1 is also
// rewritten so only one local redirect URI has to be registered.
export function loopbackEquivalent(origin: string) {
  const url = new URL(origin)

  if (!WILDCARD_HOSTNAMES.includes(url.hostname) && url.hostname !== "127.0.0.1") return null

  url.hostname = "localhost"
  return url.origin
}

// Google only accepts https redirect URIs, plus plain http for loopback addresses.
export function isAllowedOAuthOrigin(origin: string) {
  const url = new URL(origin)

  if (url.protocol === "https:") return true
  return url.protocol === "http:" && LOOPBACK_HOSTNAMES.includes(url.hostname)
}

// Google matches this value literally against the console entry, so an explicit
// override is needed whenever the app is reached through a proxy or tunnel.
export function resolveRedirectUri(origin: string) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim()
  if (configured) return configured

  const url = new URL(origin)
  if (url.hostname === "127.0.0.1") url.hostname = "localhost"

  return `${url.origin}${GOOGLE_CALLBACK_PATH}`
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

  const token = (await response.json()) as {
    id_token?: string
    access_token?: string
    error_description?: string
    error?: string
  }

  if (!response.ok || !token.id_token) {
    const detail = token.error_description || token.error || "Google rejected the sign-in request."
    if (/client secret is invalid/i.test(detail) || token.error === "invalid_client") {
      throw new Error("invalid_client_secret")
    }
    if (/redirect_uri/i.test(detail)) {
      throw new Error("redirect_uri_mismatch")
    }
    throw new Error(detail)
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

  let picture = String(claims.picture ?? "").trim()
  let name = String(claims.name ?? "").trim()

  // Workspace accounts often omit `picture` from the ID token. Userinfo is the
  // reliable source for the Google account photo.
  if (token.access_token) {
    try {
      const userinfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      })
      if (userinfoResponse.ok) {
        const userinfo = (await userinfoResponse.json()) as { picture?: string; name?: string }
        picture = String(userinfo.picture ?? picture).trim()
        name = String(userinfo.name ?? name).trim()
      }
    } catch {
      // Keep ID token claims if userinfo is unavailable.
    }
  }

  return {
    email: String(claims.email ?? "").trim().toLowerCase(),
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name,
    picture,
  }
}
