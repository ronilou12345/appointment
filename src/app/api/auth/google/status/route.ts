import { NextResponse } from "next/server"
import { getGoogleEnvStatus } from "@/lib/google-oauth"

export async function GET() {
  return NextResponse.json(getGoogleEnvStatus())
}
