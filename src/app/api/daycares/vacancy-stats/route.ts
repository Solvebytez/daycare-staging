import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api";

/**
 * Same-origin proxy for vacancy stats so the browser never hits cross-origin CORS
 * (staging Vercel → Express API with credentials is brittle).
 */
export async function GET(request: NextRequest) {
  try {
    const region = request.nextUrl.searchParams.get("region") || "Toronto";
    const backendUrl = getApiBaseUrl();
    const url = `${backendUrl}/api/daycares/vacancy-stats?region=${encodeURIComponent(region)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        "[vacancy-stats proxy] backend error:",
        response.status,
        body.slice(0, 500)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Backend request failed",
          message: response.statusText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[vacancy-stats proxy]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Proxy failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
