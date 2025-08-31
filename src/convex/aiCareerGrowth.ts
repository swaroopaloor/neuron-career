"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateCareerPlan = action({
  args: {
    about: v.string(),
    dreamRole: v.string(),
    weeks: v.number(),
    // Add: user calibration inputs
    currentLevel: v.string(),
    yearsExperience: v.number(),
    hoursPerWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Strengthen and personalize the prompt using currentLevel, yearsExperience, and hoursPerWeek
    const prompt = `You are a senior career mentor. Create a highly accurate, realistic, and actionable career development plan tailored to the user's CURRENT LEVEL, YEARS OF EXPERIENCE, AVAILABLE HOURS/WEEK, and DREAM ROLE.

User Background (verbatim): ${args.about}
Current Level: ${args.currentLevel}
Years of Experience: ${args.yearsExperience}
Available Time: ${args.hoursPerWeek} hours/week
Dream Role: ${args.dreamRole}
Timeline: ${args.weeks} weeks

Strict output format: Return ONLY a JSON object with EXACTLY these fields and structure:

{
  "topics": ["topic1", "topic2", ...], 
  "courses": [
    { "title": "Course Name", "provider": "Platform/Provider", "url": "https://actual-course-url.com" }
  ],
  "certifications": ["cert1", "cert2", ...],
  "timeline": [
    {
      "week": 1,
      "focus": "Provide 4-6 concrete action items, one per line, each starting with '- '. Each task MUST include: a specific deliverable or output, and where possible a resource (course/module/reading/link). Calibrate workload to ${args.hoursPerWeek}h/week and level ${args.currentLevel}. Example:
- Complete Coursera 'X' Module 1 and take notes (2h): https://...
- Build mini-project 'Y' with feature Z and README (3h)
- Practice 10 role-specific questions on topic A (1h)
- Share progress post on LinkedIn summarizing key learnings (0.5h)"
    }
  ],
  "summary": "2-3 motivating sentences summarizing the plan and expected outcomes"
}

Requirements:
- Tailor depth, pace, and complexity to the user's level (${args.currentLevel}) and years of experience (${args.yearsExperience}).
- Ensure weekly workload aligns with ${args.hoursPerWeek} hours/week. Avoid unrealistic scope.
- Courses MUST be real with accurate URLs (Coursera, Udemy, edX, Pluralsight, LinkedIn Learning, etc.).
- Certifications MUST be relevant to ${args.dreamRole}.
- No generic advice; every weekly task should be specific, measurable, and tied to the target role.
- Prefer role-specific topics, tools, frameworks, and portfolio-worthy outputs.
- Return ONLY the JSON object, no extra text, no markdown, no code fences.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2200,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const contentRaw = data?.choices?.[0]?.message?.content;
      if (!contentRaw || typeof contentRaw !== "string") {
        throw new Error("No content received from AI");
      }

      // Robust JSON extraction: handle cases with extra text or code fences
      let jsonText = contentRaw.trim();
      if (!jsonText.startsWith("{")) {
        const start = jsonText.indexOf("{");
        const end = jsonText.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          jsonText = jsonText.slice(start, end + 1);
        }
      }

      let plan: any;
      try {
        plan = JSON.parse(jsonText);
      } catch (e) {
        throw new Error("Failed to parse AI JSON response");
      }

      // Validate structure
      if (!plan.topics || !plan.courses || !plan.certifications || !plan.timeline || !plan.summary) {
        throw new Error("Invalid plan structure received from AI");
      }

      return plan;
    } catch (error) {
      console.error("Error generating career plan:", error);

      // Fallback plan with actionable weekly bullets
      return {
        topics: [
          "Fundamentals & Core Skills",
          "Industry-Specific Knowledge",
          "Practical Projects",
          "Professional Networking",
          "Interview Preparation",
          "Continuous Learning",
        ],
        courses: [
          {
            title: "Career Development Fundamentals",
            provider: "Coursera",
            url: "https://www.coursera.org/specializations/career-success",
          },
          {
            title: "Professional Skills Development",
            provider: "LinkedIn Learning",
            url: "https://www.linkedin.com/learning/topics/professional-development",
          },
        ],
        certifications: [
          "Industry-relevant professional certification",
          "Skills-based credential",
        ],
        timeline: Array.from({ length: args.weeks }, (_, i) => {
          const week = i + 1;
          let phase = "Foundation Building";
          if (i >= 4 && i < 8) phase = "Skill Development";
          else if (i >= 8 && i < 12) phase = "Project Implementation";
          else if (i >= 12) phase = "Interview Preparation";

          return {
            week,
            focus:
              phase === "Foundation Building"
                ? `- Review core fundamentals relevant to ${args.dreamRole || "your target role"}
- Complete 2-3 foundational lessons (take notes)
- Build a tiny exercise applying new concepts
- Summarize learnings in a short post`
                : phase === "Skill Development"
                ? `- Deep-dive into an intermediate module
- Implement 1-2 features in a sample project
- Create flashcards for key concepts
- Share progress update with links`
                : phase === "Project Implementation"
                ? `- Define scope for a portfolio-ready project
- Build and document a MVP
- Add README with screenshots and instructions
- Ask for feedback from a peer or community`
                : `- Refresh fundamentals with quick quizzes
- Practice 2-3 mock interviews
- Polish resume and LinkedIn with project highlights
- Apply to 5-10 targeted roles and track outcomes`,
          };
        }),
        summary: `Personalized ${args.weeks}-week plan aligned to ${args.dreamRole || "your target role"} with roughly ${args.hoursPerWeek} hours/week, calibrated to your current level (${args.currentLevel}).`,
      };
    }
  },
});