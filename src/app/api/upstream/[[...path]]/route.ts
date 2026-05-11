import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function backendOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
    "https://api.kinderbridge.ca"
  );
}

/**
 * Auth cookies from Render may use Domain=.kinderbridge.ca + SameSite=None (cross-site SPA).
 * The browser stores them on the Vercel host after we strip Domain; SameSite=None can still
 * be dropped or mishandled on refresh. Force Lax + host-only for this same-origin proxy.
 */
function normalizeProxySetCookie(cookie: string): string {
  let c = cookie.replace(/;\s*[Dd]omain=[^;]*/gi, "");
  c = c.replace(/;\s*SameSite=[^;]*/gi, "; SameSite=Lax");
  if (!/;\s*SameSite=/i.test(c)) {
    c += "; SameSite=Lax";
  }
  c = c.replace(/;;+/g, ";").replace(/^[;\s]+|[;\s]+$/g, "").trim();
  return c;
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
    // Do not forward hop-by-hop or encoding: we force identity to upstream so the
    // body we buffer is plain JSON (avoids gzip/br bytes + stripped headers mismatch).
    if (
      [
        "host",
        "connection",
        "content-length",
        "transfer-encoding",
        "accept-encoding",
      ].includes(k)
    ) {
      return;
    }
    headers.set(key, value);
  });
  headers.set("Accept-Encoding", "identity");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
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

  const getSetCookie = (
    upstream.headers as unknown as { getSetCookie?: () => string[] }
  ).getSetCookie?.bind(upstream.headers);

  /** Only forward safe headers; never forward encoding/length from upstream (Vercel may gzip again). */
  function copySafeUpstreamHeaders(out: NextResponse, upstreamRes: Response) {
    const allow = new Set(["content-type", "cache-control", "etag"]);
    upstreamRes.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === "set-cookie") return;
      if (!allow.has(k)) return;
      out.headers.set(key, value);
    });
  }

  function appendNormalizedCookies(out: NextResponse) {
    if (getSetCookie) {
      for (const raw of getSetCookie()) {
        out.headers.append("Set-Cookie", normalizeProxySetCookie(raw));
      }
      return;
    }
    const single = upstream.headers.get("set-cookie");
    if (single) out.headers.append("Set-Cookie", normalizeProxySetCookie(single));
  }

  if (request.method === "HEAD") {
    const out = new NextResponse(null, { status: upstream.status });
    appendNormalizedCookies(out);
    copySafeUpstreamHeaders(out, upstream);
    return out;
  }

  const buf = await upstream.arrayBuffer();
  const out = new NextResponse(buf, { status: upstream.status });
  appendNormalizedCookies(out);
  copySafeUpstreamHeaders(out, upstream);

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
