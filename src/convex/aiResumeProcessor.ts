"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Groq from "groq-sdk";

export const generateSuggestions = action({
  args: {
    resumeContent: v.string(),
    jobDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error("GROQ API key not configured");
      }

      const prompt = `You are an expert resume optimization assistant. Analyze the following resume content and provide actionable suggestions for improvement.

Resume Content:
${args.resumeContent}

${args.jobDescription ? `Job Description to target:\n${args.jobDescription}\n` : ''}

Please provide suggestions in the following JSON format:
{
  "atsOptimization": ["suggestion 1", "suggestion 2", ...],
  "keywordSuggestions": ["keyword 1", "keyword 2", ...],
  "contentImprovements": ["improvement 1", "improvement 2", ...],
  "structureRecommendations": ["recommendation 1", "recommendation 2", ...],
  "overallScore": 85
}

Focus on:
1. ATS compatibility and keyword optimization
2. Content clarity and impact
3. Structure and formatting
4. Industry-specific improvements
5. Quantifiable achievements`;

      // Switch to Groq SDK for consistency across the codebase
      const groq = new Groq({ apiKey: groqApiKey });
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      // Parse structured JSON directly
      let suggestions;
      try {
        suggestions = JSON.parse(content);
      } catch {
        // Fallback if content isn't perfectly formatted as JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      }

      if (!suggestions) {
        // Final fallback (same as existing behavior)
        return {
          success: true,
          suggestions: {
            atsOptimization: ["Ensure consistent formatting throughout the document"],
            keywordSuggestions: ["Add relevant industry keywords"],
            contentImprovements: ["Quantify achievements with specific numbers"],
            structureRecommendations: ["Use clear section headers"],
            overallScore: 75,
          },
        };
      }

      return {
        success: true,
        suggestions,
      };
    } catch (error) {
      console.error("AI Resume Processing Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const refineText = action({
  args: {
    text: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("GROQ API key not configured");
    }

    const groq = new Groq({ apiKey: groqApiKey });

    const system =
      "You rewrite and polish resume content. Return ONLY plain text (no JSON, no markdown). Keep it concise, impactful, and ATS-friendly.";
    const user = `Context: ${args.context || "general"}
Original:
${args.text}

Rules:
- Improve clarity, grammar, and punch.
- Prefer active voice and measurable impact.
- Keep original meaning; don't invent experience.
- Bullet-like flow allowed via short lines; but return plain text only.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const content = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!content) {
      throw new Error("Empty response from model");
    }
    return content;
  },
});

export const suggestTargetRoles = action({
  args: { resumeContent: v.string() },
  handler: async (ctx, args) => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("GROQ API key not configured");
    }
    const groq = new Groq({ apiKey: groqApiKey });
    const prompt = `You are a career coach. Read the resume text below and return ONLY a JSON array (no markdown) of 3-7 concise target roles that are realistic next steps based on skills and experiences. Avoid seniority inflation; keep roles specific and aligned to the resume.

Resume:
${args.resumeContent}

Return JSON like:
["Backend Engineer", "Full Stack Developer (TypeScript/React)", "Platform Engineer"]`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Return JSON only. No extra text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content ?? "[]";
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const roles: string[] = parsed
          .map((r) => (typeof r === "string" ? r.trim() : ""))
          .filter(Boolean)
          .slice(0, 7);
        return roles;
      }
    } catch {
      // no-op, fall through
    }
    return [];
  },
});

export const generateOutreachEmail = action({
  args: {
    resumeContent: v.string(),
    targetRole: v.string(),
    companyName: v.string(),
    contactFirstName: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("dm")),
  },
  handler: async (ctx, args) => {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("GROQ API key not configured");
    }
    const groq = new Groq({ apiKey: groqApiKey });

    const system = `You are a concise professional outreach writer.
- Use the user's resume highlights to tailor a short, credible message.
- Avoid generic placeholders and avoid asking the user to "add" bullets.
- Keep it warm, specific, and respectful. No fluff.
- If channel is "email", return both subject and body. If "dm", return only body.
- Body should be 5–8 sentences max. Prefer a single short paragraph + 1 compact bullet block if truly helpful.
- No markdown code fences.`;

    const user = `Resume:
${args.resumeContent}

Write a ${
      args.channel === "email" ? "professional email" : "short DM"
    } to ${args.contactFirstName || "a contact"} at ${args.companyName} for the role "${args.targetRole}".
Requirements:
- Reference 1–2 concrete strengths from the resume (skills, achievements) relevant to ${args.targetRole}.
- Ask for a quick intro/referral or brief chat (pick one).
- Keep tone friendly and respectful, no hype.
- For email: include a crisp subject line.
- Return JSON only:
${
  args.channel === "email"
    ? `{"subject": "...", "body": "..." }`
    : `{"body": "..." }`
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 600,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(content);
      if (args.channel === "email") {
        const subject = String(parsed.subject || "").trim();
        const body = String(parsed.body || "").trim();
        if (!subject || !body) throw new Error("Model returned empty subject/body");
        return { subject, body };
      } else {
        const body = String(parsed.body || "").trim();
        if (!body) throw new Error("Model returned empty body");
        return { body };
      }
    } catch {
      throw new Error("Failed to generate outreach content. Please try again.");
    }
  },
});