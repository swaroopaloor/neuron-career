"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import pdf from "pdf-parse";

export const analyzeResume = internalAction({
  args: {
    analysisId: v.id("analyses"),
    resumeFileId: v.id("_storage"),
    jobDescription: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key not configured");
      }

      const resumeFile = await ctx.storage.get(args.resumeFileId);
      if (!resumeFile) {
        throw new Error("Resume file not found");
      }
      const resumeBuffer = await resumeFile.arrayBuffer();
      const data = await pdf(Buffer.from(resumeBuffer));
      const resumeText = data.text;

      const prompt = `Analyze this resume against the job description and provide a detailed assessment.

RESUME:
${resumeText}

JOB DESCRIPTION:
${args.jobDescription}

Please respond with a JSON object containing:
{
  "matchScore": number (0-100),
  "atsScore": number (0-100),
  "missingKeywords": string[] (top 10 missing keywords),
  "suggestedJobs": [
    {
      "title": string,
      "company": string,
      "location": string,
      "url": string
    }
  ] (3 relevant job suggestions)
}

Be thorough and accurate in your analysis.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-app.com",
          "X-Title": "Resume Analyzer"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API error: ${response.statusText} - ${errorBody}`);
      }

      const responseData = await response.json();
      const content = responseData.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No response from AI model");
      }

      // Parse the JSON response
      const analysis = JSON.parse(content);

      // Update the analysis with results
      await ctx.runMutation(internal.analyses.updateAnalysisResults, {
        id: args.analysisId,
        matchScore: analysis.matchScore,
        atsScore: analysis.atsScore,
        missingKeywords: analysis.missingKeywords,
        suggestedJobs: analysis.suggestedJobs,
        status: "completed"
      });

    } catch (error) {
      console.error("Analysis error:", error);
      
      // Update analysis with error status
      await ctx.runMutation(internal.analyses.updateAnalysisResults, {
        id: args.analysisId,
        matchScore: 0,
        atsScore: 0,
        missingKeywords: [],
        suggestedJobs: [],
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error during analysis"
      });
    }
  },
});