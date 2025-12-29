import { headers } from "next/headers";

// TODO: query database (Redis) to get list of allowed domains (list of UNA hosts) ?
const ALLOWED_HOSTS = [
  'hihi.com',
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("u");

  if (!imageUrl) {
    return new Response("Missing url", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  // 🔐 protocol check
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return new Response("Only HTTPS and HTTP allowed", { status: 403 });
  }

  // 🔐 hostname allow-list
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  // 🔐 tenant isolation (пример)
  // TODO: implement tenant isolation logic if needed

  // 🕒 fetch with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  let res;
  try {
    res = await fetch(parsed.href, {
      signal: controller.signal,
    });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    return new Response("Image not found", { status: 404 });
  }

  const contentType = res.headers.get("content-type") || "";

  // 🔐 mime-type validation
  if (!contentType.startsWith("image/")) {
    return new Response("Not an image", { status: 415 });
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
