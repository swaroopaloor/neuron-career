"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const generateContactsForCompany = action({
  args: {
    companyName: v.string(),
    titleHint: v.optional(v.string()),
    count: v.optional(v.number()), // default 5
  },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key not configured. Set GROQ_API_KEY in Integrations.");
    }

    const count = Math.min(Math.max(args.count ?? 5, 3), 10);
    const titleHint = args.titleHint?.trim();
    const prompt = `
You are a helpful assistant that suggests likely professional contacts for warm introductions at a company.

Task:
- Generate ${count} realistic contacts for the company "${args.companyName}".
- Prefer roles related to ${titleHint ? `"${titleHint}"` : "the most relevant hiring counterpart"} (e.g., hiring managers, team leads, recruiters).
- Include plausible full names and job titles. Include emails only if you can infer a generic pattern; otherwise omit email.
- Output strictly a JSON array of objects with fields: name (string), title (string), email (string | omit if unknown).

Example:
[
  { "name": "Alex Johnson", "title": "Engineering Manager", "email": "alex.johnson@company.com" },
  { "name": "Priya Sharma", "title": "Senior Recruiter" }
]
Only return valid JSON. No extra commentary.
`.trim();

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return JSON only. No markdown code fences." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Groq request failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content from Groq.");

    let contacts: Array<{ name: string; title?: string; email?: string }> = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        contacts = parsed
          .map((c) => ({
            name: String(c?.name || "").trim(),
            title: c?.title ? String(c.title).trim() : undefined,
            email: c?.email ? String(c.email).trim() : undefined,
          }))
          .filter((c) => c.name.length > 0);
      } else {
        throw new Error("Response was not a JSON array.");
      }
    } catch (e) {
      throw new Error("Failed to parse contacts JSON from model. Try again.");
    }

    // Insert with dedupe
    const result = await ctx.runMutation(internal.outreach.insertGeneratedContacts, {
      companyName: args.companyName,
      contacts,
    }) as { inserted: number };

    return result;
  },
});