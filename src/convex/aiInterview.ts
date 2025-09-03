"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";
import { extractText } from "unpdf";

async function callLLM(prompt: string, temperature = 0.4) {
  // Groq-only implementation
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("AI not configured. Please add GROQ_API_KEY in Integrations.");
  }
  const groq = new Groq({ apiKey });
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
    // Reduce tokens to lower latency and avoid timeouts
    max_tokens: 500,
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
    interviewType: v.optional(v.string()),
    resumeFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const count = Math.min(Math.max(args.count ?? 50, 5), 80);

    // Pull resume text if provided
    let resumeText = "";
    if (args.resumeFileId) {
      const file = await ctx.storage.get(args.resumeFileId);
      if (file) {
        const buf = await file.arrayBuffer();
        const { text } = await extractText(buf);
        resumeText = Array.isArray(text) ? text.join("\n") : (text || "");
      }
    }

    // Strong guidance per type
    const type = (args.interviewType || "Balanced").toLowerCase();
    const typeGuidance =
      type === "technical"
        ? `Focus on role-specific technical depth:
- Systems, algorithms, architecture, troubleshooting relevant to the JD
- Ask about trade-offs, metrics, constraints, incident handling
- Prefer scenario-based and past-experience technical probes`
        : type === "hr"
        ? `Focus on people & process:
- Conflict resolution, stakeholder comms, cross-functional collab
- Values fit, leadership style, motivation, feedback, change management
- Behavioral STAR prompts grounded in resume highlights`
        : type === "intro"
        ? `Focus on storytelling & alignment:
- Background narrative, impact highlights, strengths, goals, motivation
- Why this role/company, role fit, high-level problem solving
- Use candidate's resume to anchor examples`
        : `Blend behavioral, situational, and technical aligned to the JD.`;

    const prompt = `
Given the Job Description and Candidate Resume, generate ${count} highly relevant interview questions.
STRICT: Only output one question per line with no numbering or extra text.

Interview Type: ${args.interviewType ?? "Balanced"}
Guidance:
${typeGuidance}

Job Description (trimmed):
${args.jd.slice(0, 3000)}

Resume (trimmed):
${resumeText ? resumeText.slice(0, 2500) : "N/A"}

Rules:
- Be specific to the JD's responsibilities, stack, domain, and seniority.
- Mirror the interview type's style and depth precisely.
- Avoid generic prompts; anchor in resume experience and JD requirements.
- Keep each question concise (under 25 words for follow-ups, under 30 words otherwise).
`;

    const raw = await callLLM(prompt, 0.45);
    const lines = raw
      .split("\n")
      .map((l: string) => l.replace(/^\s*\d+[\).\s-]?\s*/, "").trim())
      .filter((l: string) => l.length > 0 && !/^q[:.\-\s]/i.test(l));
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
    interviewType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `
You are conducting a mock interview${args.interviewType ? ` (${args.interviewType} round)` : ""} based on this job description: ${args.jd ?? "N/A"}.
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

export const suggestAnswer = action({
  args: {
    question: v.string(),
    jd: v.optional(v.string()),
    resumeFileId: v.optional(v.id("_storage")),
    interviewType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("AI not configured. Please add GROQ_API_KEY in Integrations.");
    }

    // Pull resume text if provided
    let resumeText = "";
    if (args.resumeFileId) {
      const file = await ctx.storage.get(args.resumeFileId);
      if (file) {
        const buf = await file.arrayBuffer();
        const { text } = await extractText(buf);
        resumeText = Array.isArray(text) ? text.join("\n") : (text || "");
      }
    }

    const prompt = `
You are a world-class interview coach. Craft a strong sample answer to the following interview question.

Constraints:
- 120–170 words, crisp, professional, confident
- Implicitly follow STAR where relevant
- Include realistic metrics where suitable
- Align to the job description
- If resume content is provided, tailor phrasing to that background
${args.interviewType ? `- Match tone/content for a ${args.interviewType} round` : ""}

Question: ${args.question}

Job Description:
${(args.jd ?? "N/A").slice(0, 3000)}

Resume (optional):
${resumeText ? resumeText.slice(0, 2500) : "N/A"}

Return only the answer text, no preface.`;

    const out = await callLLM(prompt, 0.35);
    return out;
  },
});

export const sessionFeedback = action({
  args: {
    transcript: v.string(),
    jd: v.optional(v.string()),
    interviewType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `
You are an experienced interviewer and coach. Analyze the candidate's full interview transcript and provide concise, actionable feedback tailored to the role and interview type.

Context:
- Interview Type: ${args.interviewType ?? "General"}
- Job Description: ${args.jd ?? "N/A"}

Transcript:
${args.transcript.slice(0, 8000)}

Output format:
- Overall Performance (2-3 sentences)
- Strengths (bullet points)
- Areas to Improve (bullet points)
- Topics to Study (bullet points, concrete and role-aligned)
- Suggested Practice Plan (3-5 bullets, concrete next steps)

Keep it compact, specific, and professional. No preamble; start directly.
`;
    const out = await callLLM(prompt, 0.4);
    return out;
  },
});

export const salaryCoach = action({
  args: {
    jd: v.string(),
    resumeFileId: v.optional(v.id("_storage")),
    roleTitle: v.optional(v.string()),
    location: v.optional(v.string()),
    experienceYears: v.optional(v.number()),
    currentBase: v.optional(v.number()),
    currentBonus: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Pull resume text if provided
    let resumeText = "";
    if (args.resumeFileId) {
      const file = await ctx.storage.get(args.resumeFileId);
      if (file) {
        const buf = await file.arrayBuffer();
        const { text } = await extractText(buf);
        resumeText = Array.isArray(text) ? text.join("\n") : (text || "");
      }
    }

    const prompt = `
You are a concise salary intel and negotiation coach. Given the candidate background and a target role, produce:
- Market bands (Base/Total Comp) with short justification and likely range for the candidate.
- Scripts: initial outreach, post-offer negotiation, competing offer leverage.
- Tips: crisp bullets for timing, anchors, risks, and phrases to avoid.
Return STRICT JSON only with this shape:
{
  "marketBands": [
    { "label": "Typical", "base": "₹X - ₹Y", "tc": "₹X - ₹Y", "note": "short note" },
    { "label": "Top-tier", "base": "₹X - ₹Y", "tc": "₹X - ₹Y", "note": "short note" }
  ],
  "scripts": {
    "initialReachout": "text...",
    "postOfferNegotiation": "text...",
    "competingOfferLeverage": "text..."
  },
  "tips": [ "tip1", "tip2", "tip3", "tip4" ]
}

Context:
- Role Title: ${args.roleTitle || "N/A"}
- Location: ${args.location || "N/A"}
- Experience: ${typeof args.experienceYears === "number" ? args.experienceYears : "N/A"} years
- Current Base: ${typeof args.currentBase === "number" ? `₹${args.currentBase}` : "N/A"}
- Current Bonus: ${typeof args.currentBonus === "number" ? `₹${args.currentBonus}` : "N/A"}

Job Description (trimmed):
${args.jd.slice(0, 2800)}

Resume (trimmed):
${resumeText ? resumeText.slice(0, 2400) : "N/A"}

Rules:
- Prefer INR (₹) if role appears India-based; otherwise keep generic currency symbols if not sure.
- Be realistic, cite short justification in notes (company tier, city, seniority).
- Keep scripts crisp, polite, and professional. No markdown fences, plain text only.
`;

    // Ask for structured JSON; parse robustly
    const raw = await callLLM(prompt, 0.35);
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          // fallthrough
        }
      }
    }
    if (!parsed) {
      // Minimal safe fallback
      return {
        marketBands: [
          { label: "Typical", base: "—", tc: "—", note: "Could not fetch ranges. Try again." },
        ],
        scripts: {
          initialReachout: "Hi [Name], I'm exploring opportunities for [Role]. Based on my experience in [skill/impact], I'd love to discuss fit and compensation expectations.",
          postOfferNegotiation: "Thanks for the offer—very excited about the role. Given scope and market data for [city/level], is there room to move base to [target] or increase sign-on?",
          competingOfferLeverage: "I wanted to be transparent: I have another offer at [comp]. Your role is my top choice—if we can align closer to [target], I'm ready to sign.",
        },
        tips: [
          "Anchor on total comp; negotiate components (base, sign-on, bonus).",
          "Stay positive and collaborative; avoid ultimatums.",
          "Use ranges, not single numbers; justify with impact and market.",
        ],
      };
    }
    return parsed;
  },
});