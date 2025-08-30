"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateSuggestions = action({
  args: {
    resumeContent: v.string(),
    jobDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) {
        throw new Error("OpenRouter API key not configured");
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

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-domain.com",
          "X-Title": "Resume Analyzer AI",
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
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response from AI");
      }

      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          suggestions,
        };
      }

      // Fallback if JSON parsing fails
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
    } catch (error) {
      console.error("AI Resume Processing Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});
