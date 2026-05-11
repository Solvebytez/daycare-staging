import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function backendOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    "https://api.kinderbridge.ca"
  );
}

/** Strip Domain so Set-Cookie applies to the current host (e.g. *.vercel.app). */
function scrubSetCookie(cookie: string): string {
  return cookie.replace(/;\s*[Dd]omain=[^;]*/g, "");
}

async function forward(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const segments = pathSegments.filter(Boolean);
  if (!segments.length) {
    return NextResponse.json({ error: "Missing upstream path" }, { status: 400 });
  }

  const upstreamPath = segments.join("/");
  const target = `${backendOrigin()}/${upstreamPath}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (["host", "connection", "content-length", "transfer-encoding"].includes(k)) {
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const buf = await request.arrayBuffer();
    init.body = buf.byteLength ? buf : undefined;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (e) {
    console.error("[api/upstream] fetch failed:", target, e);
    return NextResponse.json(
      { success: false, error: "Upstream unreachable", message: String(e) },
      { status: 502 }
    );
  }

  // Node fetch decompresses gzip/br; forwarding Content-Encoding with a decoded body
  // causes net::ERR_CONTENT_DECODING_FAILED in the browser.
  const SKIP_RESPONSE_HEADERS = new Set([
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "set-cookie",
  ]);

  const getSetCookie = (
    upstream.headers as unknown as { getSetCookie?: () => string[] }
  ).getSetCookie?.bind(upstream.headers);

  if (request.method === "HEAD") {
    const out = new NextResponse(null, { status: upstream.status });
    if (getSetCookie) {
      for (const raw of getSetCookie()) {
        out.headers.append("Set-Cookie", scrubSetCookie(raw));
      }
    } else {
      const single = upstream.headers.get("set-cookie");
      if (single) out.headers.append("Set-Cookie", scrubSetCookie(single));
    }
    upstream.headers.forEach((value, key) => {
      if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
      out.headers.set(key, value);
    });
    return out;
  }

  const buf = await upstream.arrayBuffer();
  const out = new NextResponse(buf, { status: upstream.status });

  if (getSetCookie) {
    for (const raw of getSetCookie()) {
      out.headers.append("Set-Cookie", scrubSetCookie(raw));
    }
  } else {
    const single = upstream.headers.get("set-cookie");
    if (single) {
      out.headers.append("Set-Cookie", scrubSetCookie(single));
    }
  }

  upstream.headers.forEach((value, key) => {
    if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
    out.headers.set(key, value);
  });

  return out;
}

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}

export async function HEAD(request: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path = [] } = await ctx.params;
  return forward(request, path);
}
