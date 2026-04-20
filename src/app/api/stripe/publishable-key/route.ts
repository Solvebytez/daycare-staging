import { NextResponse } from "next/server";
import { readPublishableKeyFromDisk } from "../../../../../next-env-stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const fromEnv =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const fromDisk = readPublishableKeyFromDisk();
  const publishableKey = fromEnv || fromDisk;

  return NextResponse.json({ publishableKey });
}
