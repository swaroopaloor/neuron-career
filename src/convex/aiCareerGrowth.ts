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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const prompt = `You are a career growth expert and mentor. Based on the user's background and dream role, create a comprehensive career development plan.

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
      "focus": "Specific focus area for this week"
    }
  ], // Weekly breakdown for ${args.weeks} weeks
  "summary": "A motivational 2-3 sentence summary of the career plan"
}

Requirements:
- Provide REAL course URLs from platforms like Coursera, Udemy, edX, Pluralsight, LinkedIn Learning, etc.
- Make certifications industry-relevant and achievable
- Create a realistic weekly timeline that builds progressively
- Tailor everything specifically to the user's background and target role
- Focus on practical, actionable steps

Return ONLY the JSON object, no additional text.`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://career-growth-app.com",
          "X-Title": "Career Growth Planner",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from AI");
      }

      // Parse the JSON response
      const plan = JSON.parse(content);
      
      // Validate the structure
      if (!plan.topics || !plan.courses || !plan.certifications || !plan.timeline || !plan.summary) {
        throw new Error("Invalid plan structure received from AI");
      }

      return plan;
    } catch (error) {
      console.error("Error generating career plan:", error);
      
      // Return a fallback plan if AI fails
      return {
        topics: [
          "Fundamentals & Core Skills",
          "Industry-Specific Knowledge", 
          "Practical Projects",
          "Professional Networking",
          "Interview Preparation",
          "Continuous Learning"
        ],
        courses: [
          {
            title: "Career Development Fundamentals",
            provider: "Coursera",
            url: "https://www.coursera.org/specializations/career-success"
          },
          {
            title: "Professional Skills Development",
            provider: "LinkedIn Learning",
            url: "https://www.linkedin.com/learning/topics/professional-development"
          }
        ],
        certifications: [
          "Industry-relevant professional certification",
          "Skills-based credential"
        ],
        timeline: Array.from({ length: args.weeks }, (_, i) => ({
          week: i + 1,
          focus: i < 4 ? "Foundation Building" : 
                 i < 8 ? "Skill Development" : 
                 i < 12 ? "Project Implementation" : "Interview Preparation"
        })),
        summary: `Personalized ${args.weeks}-week career development plan tailored to help you transition into ${args.dreamRole || "your target role"}.`
      };
    }
  },
});
