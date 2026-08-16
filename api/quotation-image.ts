const MAX_BYTES = 8 * 1024 * 1024;

type NodeReq = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

type NodeRes = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string | Uint8Array) => void;
};

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return true;
  }
  if (host === "0.0.0.0" || host === "::" || host === "::1") {
    return true;
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const parts = ipv4.slice(1).map(Number);
    if (parts.some((part) => part > 255)) return true;
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function parseTargetUrl(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const target = new URL(raw);
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return null;
    }
    if (isBlockedHost(target.hostname)) return null;
    return target;
  } catch {
    return null;
  }
}

function readUrlParam(req: NodeReq) {
  const fromQuery = req.query?.url;
  if (typeof fromQuery === "string") return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery[0]) return fromQuery[0];
  if (!req.url) return null;
  try {
    return new URL(req.url, "http://localhost").searchParams.get("url");
  } catch {
    return null;
  }
}

export default async function handler(req: NodeReq, res: NodeRes) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.end();
    return;
  }

  const target = parseTargetUrl(readUrlParam(req));
  if (!target) {
    res.statusCode = 400;
    res.end("Invalid image url");
    return;
  }

  try {
    const upstream = await fetch(target, {
      redirect: "follow",
      headers: { Accept: "image/*" },
    });
    if (!upstream.ok) {
      res.statusCode = upstream.status;
      res.end();
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      res.statusCode = 415;
      res.end();
      return;
    }

    const buffer = new Uint8Array(await upstream.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
      res.statusCode = 413;
      res.end();
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.end(buffer);
  } catch {
    res.statusCode = 502;
    res.end();
  }
}
