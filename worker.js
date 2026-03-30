/**
 * Cloudflare Worker — Anthropic API proxy
 * Deploy this on Cloudflare Workers (free tier).
 * Set your API key as a secret: wrangler secret put ANTHROPIC_KEY
 */

const ALLOWED_ORIGIN = "https://nourimanekerroumi996.github.io";

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(ALLOWED_ORIGIN) });
    }

    // Only allow POST to /v1/messages
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/v1/messages") {
      return new Response("Not found", { status: 404 });
    }

    // Forward to Anthropic
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(ALLOWED_ORIGIN),
      },
    });
  },
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
