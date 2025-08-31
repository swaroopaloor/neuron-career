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