"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { extractText } from "unpdf";

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
        throw new Error("OpenRouter API key (OPENROUTER_API_KEY) is not configured in the environment.");
      }

      const resumeFile = await ctx.storage.get(args.resumeFileId);
      if (!resumeFile) {
        throw new Error(`Resume file with ID '${args.resumeFileId}' not found in storage.`);
      }
      
      const resumeBuffer = await resumeFile.arrayBuffer();
      const { text: resumeText } = await extractText(resumeBuffer);

      if (!resumeText) {
        throw new Error("Failed to extract text from the provided resume PDF.");
      }

      const prompt = `Analyze this resume against the job description and provide a detailed assessment.

RESUME:
${resumeText}

JOB DESCRIPTION:
${args.jobDescription}

Respond with a valid JSON object containing the analysis.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-app.com",
          "X-Title": "Resume Analyzer"
        },
        body: JSON.stringify({
          model: "google/gemini-pro",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a world-class career assistant. Your response must be a single, valid JSON object with the following structure: { "matchScore": number (0-100), "atsScore": number (0-100), "missingKeywords": string[] (top 10), "topicsToMaster": { "topic": string, "description": string }[] (top 5-7 topics for interview prep), "coverLetter": string (a professional, tailored cover letter draft as a single string with markdown for formatting), "interviewQuestions": { "question": string, "category": string }[] (5-7 likely interview questions, categorized as "Behavioral" or "Technical"), "interviewTalkingPoints": { "point": string, "example": string }[] (3-5 key talking points for the candidate to highlight, with a brief STAR method example for each) }. Do not include any other text, explanations, or markdown formatting outside of the JSON object.`
            },
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
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
      }

      const responseData = await response.json();
      const content = responseData.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("Received an empty or invalid response from the AI model.");
      }

      // With JSON mode enabled, the content should be a guaranteed JSON string.
      const analysis = JSON.parse(content);

      // Update the analysis with results
      await ctx.runMutation(internal.analyses.updateAnalysisResults, {
        id: args.analysisId,
        matchScore: analysis.matchScore,
        atsScore: analysis.atsScore,
        missingKeywords: analysis.missingKeywords,
        topicsToMaster: analysis.topicsToMaster,
        coverLetter: analysis.coverLetter,
        interviewQuestions: analysis.interviewQuestions,
        interviewTalkingPoints: analysis.interviewTalkingPoints,
        status: "completed"
      });

    } catch (error) {
      console.error("Error during resume analysis:", {
        analysisId: args.analysisId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Update analysis with error status
      await ctx.runMutation(internal.analyses.updateAnalysisResults, {
        id: args.analysisId,
        matchScore: 0,
        atsScore: 0,
        missingKeywords: [],
        topicsToMaster: [],
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "An unknown error occurred during analysis."
      });
    }
  },
});