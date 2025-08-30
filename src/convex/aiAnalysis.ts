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

      const systemPrompt = `You are a world-class career assistant and a harsh critic. Analyze a resume against a job description with extreme scrutiny and return a single, valid JSON object only.

      CRITICAL SCORING INSTRUCTIONS:
      - Be extremely conservative. Typical average resumes should score 30-50 unless highly aligned.
      - Only exceptional resumes that perfectly match requirements should score 70+.
      - The matchScore reflects how well the resume aligns with the job description requirements and responsibilities.
      - The atsScore reflects keyword/skills alignment, clarity, structure, and ATS-parsable language (section headers, bullet clarity, quantification).
      - Always justify the scores implicitly via the improvements and missing keywords you surface.

      REQUIRED BEHAVIOR:
      - ALWAYS include atsImprovements and matchingImprovements arrays with explicit, actionable edits that the user can copy into their resume.
      - If matchScore < 70 OR atsScore < 70, include AT LEAST 5 improvement items for the corresponding category.
      - Even if both scores >= 70, still include at least 3 concise improvement items per category.
      - Each improvement item MUST specify:
        - Where to change (Summary, Skills, Experience, Projects, Education, Certifications, Keywords)
        - What to change (be specific)
        - A concrete example phrase or bullet the user can paste.

      JSON STRUCTURE:
      {
        "matchScore": number (0-100, be extremely critical),
        "atsScore": number (0-100, be extremely critical),
        "missingKeywords": string[] (top 10 essential missing keywords/skills),
        "priorityImprovements": string[] (3-5 most critical, high-impact changes that would dramatically improve the resume's effectiveness - focus on the biggest gaps and most impactful additions),
        "topicsToMaster": { "topic": string, "description": string }[] (5-7 targeted upskilling areas),
        "coverLetter": string (professional, tailored draft with markdown),
        "interviewQuestions": { "question": string, "category": "Behavioral" | "Technical" }[] (5-7),
        "interviewTalkingPoints": { "point": string, "example": string }[] (3-5),
        "atsImprovements": string[] (explicit edits focused on ATS, each item should read like: "Section: Skills — Action: Add keyword 'GraphQL'. Example: 'Skills: GraphQL, REST, TypeScript, Node.js'"),
        "matchingImprovements": string[] (explicit edits focused on better alignment with responsibilities/requirements, each item should read like: "Section: Experience — Action: Add quantified impact for AWS migrations. Example: 'Migrated 12 microservices to AWS EKS, reducing infra costs by 18%'")
      }

      Do not include any other text, explanations, or markdown outside of the JSON object.`;

      const userPrompt = `Analyze this resume against the job description and provide a detailed assessment.

      RESUME:
      ${resumeText}

      JOB DESCRIPTION:
      ${args.jobDescription}

      Respond with a valid JSON object containing the analysis, ensuring atsImprovements and matchingImprovements follow the required format and minimum counts when scores are below 70.`;

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

      const missingKeywords: string[] = Array.isArray(analysis.missingKeywords) ? analysis.missingKeywords : [];
      const topicsToMaster: Array<any> = Array.isArray(analysis.topicsToMaster) ? analysis.topicsToMaster : [];

      const aiAtsImprovements: string[] = Array.isArray(analysis.atsImprovements) ? analysis.atsImprovements : [];
      const aiMatchingImprovements: string[] = Array.isArray(analysis.matchingImprovements) ? analysis.matchingImprovements : [];
      const priorityImprovements: string[] = Array.isArray(analysis.priorityImprovements) ? analysis.priorityImprovements : [];

      const ensureImprovementCount = (items: string[], min: number) => {
        const unique = Array.from(new Set(items.map((s) => (typeof s === "string" ? s.trim() : "")))).filter(Boolean);
        if (unique.length >= min) return unique.slice(0, Math.max(min, unique.length));
        return unique;
      };

      const synthesizeFromKeywords = (keywords: string[], sectionLabel: string): string[] => {
        const suggestions: string[] = [];
        for (const kw of keywords.slice(0, 8)) {
          suggestions.push(
            `Section: Skills — Action: Add keyword '${kw}'. Example: 'Skills: ${kw}, <add 3-4 related skills>'`
          );
          suggestions.push(
            `Section: Experience — Action: Add a bullet incorporating '${kw}'. Example: 'Implemented ${kw} to improve <system/feature>, resulting in <metric/% improvement>.'`
          );
        }
        // add generic ATS-friendly structure items
        suggestions.push(
          `Section: Summary — Action: Include top 3-5 relevant skills with role fit. Example: 'Senior Backend Engineer with 5+ years in Node.js, ${keywords[0] || "AWS"}, and system design.'`
        );
        suggestions.push(
          `Section: Projects — Action: Add a project bullet highlighting '${keywords[0] || "a key job requirement"}'. Example: 'Built <project> using ${keywords[0] || "required tech"}, serving <N> users with <X%> improvement.'`
        );
        return suggestions;
      };

      const synthesizeFromTopics = (topics: Array<any>): string[] => {
        const suggestions: string[] = [];
        for (const t of topics.slice(0, 5)) {
          const topic = typeof t === "object" && t?.topic ? String(t.topic) : String(t ?? "");
          suggestions.push(
            `Section: Education/Certifications — Action: Include learning/certification for '${topic}'. Example: 'Certification: ${topic} — In Progress (Target: <Month YYYY>)'`
          );
          suggestions.push(
            `Section: Experience — Action: Add quantified bullet demonstrating '${topic}'. Example: 'Delivered ${topic}-backed solution reducing latency by 35% across 4 services.'`
          );
        }
        return suggestions;
      };

      let atsImprovements = aiAtsImprovements;
      let matchingImprovements = aiMatchingImprovements;

      const atsMin = analysis.atsScore < 70 ? 5 : 3;
      const matchMin = analysis.matchScore < 70 ? 5 : 3;

      if (atsImprovements.length < atsMin) {
        atsImprovements = ensureImprovementCount(
          [
            ...atsImprovements,
            ...synthesizeFromKeywords(missingKeywords, "ATS"),
            ...synthesizeFromTopics(topicsToMaster),
            "Section: Structure — Action: Use ATS-friendly headings (Summary, Skills, Experience, Projects, Education). Example: 'Experience' with role, company, dates, location, bullets with strong verbs and metrics.",
            "Section: Keywords — Action: Mirror exact phrasing from the JD for must-have tools/tech. Example: If JD says 'Kubernetes', prefer 'Kubernetes' over only 'K8s'.",
          ],
          atsMin
        );
      }

      if (matchingImprovements.length < matchMin) {
        matchingImprovements = ensureImprovementCount(
          [
            ...matchingImprovements,
            "Section: Summary — Action: Tailor 1–2 lines to the role and domain. Example: 'Backend Engineer focused on fintech microservices, event-driven systems, and AWS reliability.'",
            "Section: Experience — Action: Align bullets to JD responsibilities with metrics. Example: 'Designed and shipped <JD responsibility> resulting in <quantified impact>'.",
            ...synthesizeFromKeywords(missingKeywords, "Matching"),
            ...synthesizeFromTopics(topicsToMaster),
          ],
          matchMin
        );
      }

      await ctx.runMutation(internal.analyses.updateAnalysisResults, {
        id: args.analysisId,
        matchScore: analysis.matchScore,
        atsScore: analysis.atsScore,
        missingKeywords: missingKeywords,
        topicsToMaster: topicsToMaster,
        coverLetter: analysis.coverLetter,
        interviewQuestions: analysis.interviewQuestions,
        interviewTalkingPoints: analysis.interviewTalkingPoints,
        atsImprovements,
        matchingImprovements,
        priorityImprovements,
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
        atsImprovements: [],
        matchingImprovements: [],
        priorityImprovements: [],
        status: "failed",
        errorMessage: error.message || errorMessage
      });
    }
  },
});