const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function parseJsonObject(text: string) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) return jsonResponse({ error: "DEEPSEEK_API_KEY is not configured" }, 500);

  const payload = await req.json().catch(() => null);
  if (!payload) return jsonResponse({ error: "Invalid JSON body" }, 400);

  const systemPrompt = `You generate a short morning brief for a financial advisor CRM home page.
Use only the supplied tasks and meetings. Do not invent clients, counts, times, or obligations.
Choose the first priority from urgent due tasks, follow-ups, and today's earliest meeting.
Return only valid JSON:
{
  "headline": "short greeting",
  "body": "one concise sentence under 34 words",
  "priorityText": "short priority label"
}`;

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("DEEPSEEK_MODEL") || "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload) },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    return jsonResponse({ error: "Brief generation failed" }, response.status);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const brief = parseJsonObject(content);

  if (!brief) return jsonResponse({ error: "Model returned invalid JSON" }, 502);
  return jsonResponse({ brief });
});
