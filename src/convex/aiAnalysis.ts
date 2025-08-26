"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { extractText } from "unpdf";
import Groq from "groq-sdk";

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

      const groq = new Groq({ apiKey });

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

      const systemPrompt = `You are a world-class career assistant and a harsh critic. Your task is to analyze a resume against a job description with extreme scrutiny. You must provide a brutally honest, detailed assessment. Your response must be a single, valid JSON object.

      **CRITICAL SCORING INSTRUCTIONS:**
      - **Do NOT give high scores easily.** A score of 80 should be rare and reserved for near-perfect matches. An average resume for a role should score between 40-60.
      - **Justify every score.** Base your scores on a direct, line-by-line comparison of the resume against the job description's requirements.
      - **Identify Gaps:** The 'missingKeywords' and 'topicsToMaster' are the most important part of your analysis. Be specific and actionable.
      
      **JSON STRUCTURE:**
      Your response must be a single, valid JSON object with the following structure: { "matchScore": number (0-100, be critical), "atsScore": number (0-100, based on keyword alignment), "missingKeywords": string[] (top 10 specific, essential keywords missing from the resume), "topicsToMaster": { "topic": string, "description": string }[] (top 5-7 specific skills or technologies the candidate should learn for this job), "coverLetter": string (a professional, tailored cover letter draft as a single string with markdown for formatting), "interviewQuestions": { "question": string, "category": string }[] (5-7 likely interview questions, categorized as "Behavioral" or "Technical"), "interviewTalkingPoints": { "point": string, "example": string }[] (3-5 key talking points for the candidate to highlight, with a brief STAR method example for each) }.
      
      Do not include any other text, explanations, or markdown formatting outside of the JSON object.`;

      const userPrompt = `Analyze this resume against the job description and provide a detailed assessment.

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${args.jobDescription}

      Respond with a valid JSON object containing the analysis.`;

      const completion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 4000,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        errorMessage = "The AI model returned an empty or invalid response. Please try again.";
        throw new Error(errorMessage);
      }

      const analysis = JSON.parse(content);

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

    } catch (error: any) {
      console.error("Error during resume analysis:", {
        analysisId: args.analysisId,
        error: error.message,
        stack: error.stack,
      });
      
      await ctx.runMutation(internal.analyses.updateAnalysisResults, {
        id: args.analysisId,
        matchScore: 0,
        atsScore: 0,
        missingKeywords: [],
        topicsToMaster: [],
        status: "failed",
        errorMessage: error.message || errorMessage
      });
    }
  },
});