"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateCareerPlan = action({
  args: {
    about: v.string(),
    dreamRole: v.string(),
    weeks: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const prompt = `You are a career growth expert and mentor. Based on the user's background and dream role, create a comprehensive, accurate, and realistic career development plan.

User Background: ${args.about}
Dream Role: ${args.dreamRole}
Timeline: ${args.weeks} weeks

Generate a detailed career growth plan as a JSON object with this exact structure:

{
  "topics": ["topic1", "topic2", ...], // 6-8 key topics/skills to master
  "courses": [
    {
      "title": "Course Name",
      "provider": "Platform/Provider",
      "url": "https://actual-course-url.com"
    }
  ], // 3-5 high-quality, real courses with actual URLs
  "certifications": ["cert1", "cert2", ...], // 2-4 relevant industry certifications
  "timeline": [
    {
      "week": 1,
      "focus": "Detailed, actionable guidance including 3-6 concrete tasks or sub-goals for this week. Use short bullet points separated by new lines. Example:
- Read X and summarize Y
- Complete course module Z
- Build a small project A
- Share progress on LinkedIn"
    }
  ], // Weekly breakdown for ${args.weeks} weeks with SPECIFIC, PRACTICAL tasks per week
  "summary": "A motivating 2-3 sentence summary of the career plan"
}

Requirements:
- Provide REAL course URLs from platforms like Coursera, Udemy, edX, Pluralsight, LinkedIn Learning, etc.
- Make certifications industry-relevant and achievable
- Create a realistic weekly timeline that builds progressively
- Tailor everything specifically to the user's background and target role
- Focus on practical, actionable steps and measurable outcomes each week

Return ONLY the JSON object, no additional text, no markdown, no code fences.`;

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
        summary: `Personalized ${args.weeks}-week career development plan tailored to help you transition into ${
          args.dreamRole || "your target role"
        }, with weekly, actionable tasks.`,
      };
    }
  },
});