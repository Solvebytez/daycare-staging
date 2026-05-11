import { NextResponse } from "next/server";
import { readPublishableKeyFromDisk } from "../../../../../next-env-stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const fromPublic =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  // Server-only name (Vercel): avoids needing NEXT_PUBLIC_* in some setups; still returned to client for Stripe.js
  const fromServer = process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const fromDisk = readPublishableKeyFromDisk();
  const publishableKey = fromPublic || fromServer || fromDisk;

  return NextResponse.json({ publishableKey });
}
