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
    let errorMessage = "An unknown error occurred during analysis.";
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        errorMessage = "The Groq API key is not configured. Please add the GROQ_API_KEY to your project's environment variables.";
        throw new Error(errorMessage);
      }

      const resumeFile = await ctx.storage.get(args.resumeFileId);
      if (!resumeFile) {
        errorMessage = `Resume file could not be found.`;
        throw new Error(errorMessage);
      }
      
      const resumeBuffer = await resumeFile.arrayBuffer();
      const { text: resumeText } = await extractText(resumeBuffer);

      if (!resumeText) {
        errorMessage = "Failed to extract text from the resume PDF. The file might be corrupted or empty.";
        throw new Error(errorMessage);
      }

      const prompt = `Analyze this resume against the job description and provide a detailed assessment.

RESUME:
${resumeText}

JOB DESCRIPTION:
${args.jobDescription}

Respond with a valid JSON object containing the analysis.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
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
          temperature: 0.2,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        errorMessage = `The AI model provider (Groq) returned an error. Status: ${response.status}. Details: ${errorBody}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      const content = responseData.choices[0]?.message?.content;
      
      if (!content) {
        errorMessage = "The AI model returned an empty or invalid response. Please try again.";
        throw new Error(errorMessage);
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
        errorMessage: error instanceof Error ? error.message : errorMessage
      });
    }
  },
});