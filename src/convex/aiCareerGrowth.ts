"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Groq from "groq-sdk";

export const generateGrowthInsights = action({
  args: {
    resumeContent: v.string(),
    jobDescription: v.string(),
    analysisId: v.id("analyses"),
  },
  handler: async (ctx, args) => {
    try {
      const prompt = `
You are a career growth advisor. Analyze the following resume and job description to provide detailed career growth insights.

RESUME CONTENT:
${args.resumeContent}

JOB DESCRIPTION:
${args.jobDescription}

Please provide a comprehensive analysis in the following JSON format:
{
  "lackingSkills": ["skill1", "skill2", "skill3"],
  "lackingEducation": ["education1", "education2"],
  "lackingExperience": ["experience1", "experience2"],
  "growthPlan": [
    {
      "milestone": "Short-term milestone (0-6 months)",
      "details": "Specific actions to take",
      "timeline": "0-6 months"
    },
    {
      "milestone": "Medium-term milestone (6-12 months)",
      "details": "Specific actions to take",
      "timeline": "6-12 months"
    },
    {
      "milestone": "Long-term milestone (1-2 years)",
      "details": "Specific actions to take",
      "timeline": "1-2 years"
    }
  ]
}

Guidelines:
- Be specific and actionable in your recommendations
- Focus on the most critical gaps between the resume and job requirements
- Provide realistic timelines for skill development
- Include both technical and soft skills where relevant
- Consider certifications, courses, projects, and experience opportunities
- Limit each array to the most important 3-5 items
- Make sure the growth plan is progressive and builds upon previous milestones

Return only the JSON object, no additional text.
`;

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("The Groq API key is not configured. Please add the GROQ_API_KEY to your project's environment variables.");
      }

      const groq = new Groq({ apiKey });

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      // Parse the JSON response
      let insights;
      try {
        insights = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Invalid AI response format");
      }

      // Validate the structure
      if (!insights.lackingSkills || !insights.lackingEducation || !insights.lackingExperience || !insights.growthPlan) {
        throw new Error("Incomplete AI response");
      }

      // Update the analysis with the insights
      await ctx.runMutation(internal.aiCareerGrowthData.updateAnalysisWithInsights, {
        analysisId: args.analysisId,
        lackingSkills: insights.lackingSkills,
        lackingEducation: insights.lackingEducation,
        lackingExperience: insights.lackingExperience,
        growthPlan: insights.growthPlan,
      });

      return insights;
    } catch (error) {
      console.error("Error generating growth insights:", error);
      throw new Error("Failed to generate growth insights. Please try again.");
    }
  },
});

export const generateCareerPlan = action({
  args: {
    about: v.string(),
    dreamRole: v.string(),
    weeks: v.number(),
    currentLevel: v.string(),
    yearsExperience: v.number(),
    hoursPerWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("The Groq API key is not configured. Please add the GROQ_API_KEY to your project's environment variables.");
    }

    const groq = new Groq({ apiKey });

    const prompt = `
You are a meticulous career coach. Create a concise, actionable learning roadmap tailored to the user's background and target role.

USER BACKGROUND:
${args.about}

TARGET ROLE:
${args.dreamRole || "Not specified"}

CONSTRAINTS:
- Experience level: ${args.currentLevel} (${args.yearsExperience} years)
- Weekly availability: ${args.hoursPerWeek} hours
- Duration: ${args.weeks} weeks

REQUIREMENTS:
Return ONLY a valid JSON object with this exact shape:
{
  "topics": string[],                      // 5-10 concise topic statements
  "courses": [
    { "title": string, "provider": string, "url": string }
  ],                                       // 5-8 curated, reputable courses with valid URLs
  "certifications": string[],              // 3-6 relevant certs (omit if none are genuinely relevant)
  "timeline": [
    { "week": number, "focus": string }    // exactly ${args.weeks} entries; focus should be multiple lines separated by "\\n", each line a short bullet starting with "-" or "•"
  ],
  "summary": string                        // 1-2 sentence overview tailored to the role and level
}

INSTRUCTIONS:
- Ensure timeline has exactly ${args.weeks} entries from week 1 to week ${args.weeks}.
- Make bullets specific and measurable where possible.
- Prefer free / widely accessible resources when appropriate (Coursera, edX, YouTube, vendor docs).
- Keep text concise, ATS-friendly, and focused on outcomes.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI while generating career plan.");
    }

    let plan: any;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      throw new Error("Invalid AI response format for career plan.");
    }

    // Minimal validation and normalization
    if (!Array.isArray(plan.topics)) plan.topics = [];
    if (!Array.isArray(plan.courses)) plan.courses = [];
    if (!Array.isArray(plan.certifications)) plan.certifications = [];
    if (!Array.isArray(plan.timeline)) plan.timeline = [];
    if (typeof plan.summary !== "string") plan.summary = "";

    // Normalize timeline to exactly N weeks
    const N = Math.max(1, Math.min(52, args.weeks));
    const timeline = [];
    for (let i = 1; i <= N; i++) {
      const entry = plan.timeline.find((w: any) => Number(w?.week) === i) || {};
      const focus = typeof entry.focus === "string" && entry.focus.trim().length > 0
        ? entry.focus
        : "- Study core concepts\n- Practice with exercises\n- Build a small artifact";
      timeline.push({ week: i, focus });
    }
    plan.timeline = timeline;

    // Ensure course items have required fields
    plan.courses = plan.courses
      .filter((c: any) => c && typeof c.title === "string" && typeof c.provider === "string" && typeof c.url === "string")
      .slice(0, 8);

    // Slice topics and certifications to reasonable counts
    plan.topics = plan.topics.filter((t: any) => typeof t === "string" && t.trim()).slice(0, 10);
    plan.certifications = plan.certifications.filter((c: any) => typeof c === "string" && c.trim()).slice(0, 6);

    return {
      topics: plan.topics as string[],
      courses: plan.courses as Array<{ title: string; provider: string; url: string }>,
      certifications: plan.certifications as string[],
      timeline: plan.timeline as Array<{ week: number; focus: string }>,
      summary: plan.summary as string,
    };
  },
});