"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";

async function callLLM(prompt: string, temperature = 0.4) {
  // Try OpenRouter first (if configured)
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          temperature,
          messages: [
            {
              role: "system",
              content:
                "You are an expert interview coach. Be concise, practical, and specific. Avoid fluff.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const content: string = json?.choices?.[0]?.message?.content ?? "";
        if (content.trim()) return content.trim();
      } else {
        const text = await res.text().catch(() => "");
        // fall through to Groq if OpenRouter fails
        console.warn(`OpenRouter error: ${res.status} ${text}`);
      }
    } catch (e) {
      console.warn("OpenRouter request failed, falling back to Groq:", e);
    }
  }

  // Fallback: Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error(
      "AI not configured. Please set OPENROUTER_API_KEY or GROQ_API_KEY in Integrations."
    );
  }
  const groq = new Groq({ apiKey: groqKey });
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature,
    messages: [
      {
        role: "system",
        content:
          "You are an expert interview coach. Be concise, practical, and specific. Avoid fluff.",
      },
      { role: "user", content: prompt },
    ],
    max_tokens: 800,
  });
  const out = completion.choices?.[0]?.message?.content?.trim() ?? "";
  if (!out) {
    throw new Error("AI returned an empty response. Please try again.");
  }
  return out;
}

export const generateQuestions = action({
  args: {
    jd: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = Math.min(Math.max(args.count ?? 50, 5), 80);
    const prompt = `
Given the following job description, generate ${count} highly relevant mock interview questions. 
Mix behavioral, situational, technical, and role-specific strategy questions. 
Number them 1..${count}. Only output the list, one per line, no extra commentary.

Job Description:
${args.jd}
`;
    const raw = await callLLM(prompt, 0.5);
    const lines = raw
      .split("\n")
      .map((l: string) => l.replace(/^\s*\d+[\).\s-]?\s*/, "").trim())
      .filter((l: string) => l.length > 0);
    return lines.slice(0, count);
  },
});

export const polishAnswer = action({
  args: {
    question: v.string(),
    answer: v.string(),
    jd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `
Polish the following interview answer with a crisp, professional tone. 
- Keep it concise (120-200 words).
- Use the STAR framework implicitly if applicable.
- Add measurable impact where reasonable (keep realistic).
- Fix filler wording and make it confident.

Context (optional JD): ${args.jd ?? "N/A"}

Question: ${args.question}

Candidate's draft answer:
${args.answer}
`;
    const out = await callLLM(prompt, 0.4);
    return out;
  },
});

export const nextFollowUp = action({
  args: {
    previousQuestion: v.string(),
    userAnswer: v.string(),
    jd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `
You are conducting a mock interview based on this job description: ${args.jd ?? "N/A"}.
Given the last question and the candidate's answer, ask ONE smart follow-up question that digs deeper into impact, decision-making, tradeoffs, or metrics. 
Keep it under 25 words. Only output the question.

Previous Question: ${args.previousQuestion}
Candidate Answer:
${args.userAnswer}
`;
    const out = await callLLM(prompt, 0.6);
    return out.replace(/^\s*Q[:.\-]?\s*/i, "").trim();
  },
});