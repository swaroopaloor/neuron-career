import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internal } from "./_generated/api";

// Get user's analyses with pagination
export const getUserAnalyses = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to view analyses.");
    }

    const limit = args.limit || 10;
    
    const analyses = await ctx.db
      .query("analyses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return analyses;
  },
});

// Get a specific analysis
export const getAnalysis = query({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to view an analysis.");
    }

    const analysis = await ctx.db.get(args.id);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or user does not have permission to view.");
    }

    return analysis;
  },
});

// Create a new analysis
export const createAnalysis = mutation({
  args: {
    resumeFileId: v.id("_storage"),
    resumeFileName: v.optional(v.string()),
    jobDescription: v.string(),
    jobApplicationId: v.optional(v.id("jobApplications")), // Optional link to a job application
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to create an analysis.");
    }

    const analysisId = await ctx.db.insert("analyses", {
      userId: user._id,
      resumeFileId: args.resumeFileId,
      resumeFileName: args.resumeFileName,
      jobDescription: args.jobDescription,
      jobApplicationId: args.jobApplicationId,
      matchScore: 0,
      atsScore: 0,
      missingKeywords: [],
      atsImprovements: [],
      matchingImprovements: [],
      priorityImprovements: [],
      topicsToMaster: [],
      status: "processing",
      isFavorited: false,
    });

    // If a job application is linked, update it with the new analysisId
    if (args.jobApplicationId) {
      await ctx.db.patch(args.jobApplicationId, { analysisId: analysisId });
    }

    await ctx.scheduler.runAfter(0, internal.aiAnalysis.analyzeResume, {
      analysisId,
      resumeFileId: args.resumeFileId,
      jobDescription: args.jobDescription,
    });

    return analysisId;
  },
});

// Update analysis with results
export const updateAnalysisResults = internalMutation({
  args: {
    id: v.id("analyses"),
    matchScore: v.number(),
    atsScore: v.number(),
    missingKeywords: v.array(v.string()),
    topicsToMaster: v.array(v.object({
      topic: v.string(),
      description: v.string(),
    })),
    coverLetter: v.optional(v.string()),
    interviewQuestions: v.optional(v.array(v.object({
      question: v.string(),
      category: v.string(),
    }))),
    interviewTalkingPoints: v.optional(v.array(v.object({
      point: v.string(),
      example: v.string(),
    }))),
    atsImprovements: v.optional(v.array(v.string())),
    matchingImprovements: v.optional(v.array(v.string())),
    priorityImprovements: v.optional(v.array(v.string())),
    status: v.union(v.literal("completed"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Toggle favorite status
export const toggleFavorite = mutation({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to favorite an analysis.");
    }

    const analysis = await ctx.db.get(args.id);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or user does not have permission to update.");
    }

    await ctx.db.patch(args.id, {
      isFavorited: !analysis.isFavorited,
    });
  },
});

// Delete an analysis
export const deleteAnalysis = mutation({
  args: { id: v.id("analyses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to delete an analysis.");
    }

    const analysis = await ctx.db.get(args.id);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or user does not have permission to delete.");
    }

    await ctx.db.delete(args.id);
  },
});