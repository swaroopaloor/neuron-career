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
      throw new Error("User not authenticated");
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
      throw new Error("User not authenticated");
    }

    const analysis = await ctx.db.get(args.id);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or access denied");
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
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const analysisId = await ctx.db.insert("analyses", {
      userId: user._id,
      resumeFileId: args.resumeFileId,
      resumeFileName: args.resumeFileName,
      jobDescription: args.jobDescription,
      matchScore: 0,
      atsScore: 0,
      missingKeywords: [],
      topicsToMaster: [],
      status: "processing",
      isFavorited: false,
    });

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
      throw new Error("User not authenticated");
    }

    const analysis = await ctx.db.get(args.id);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or access denied");
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
      throw new Error("User not authenticated");
    }

    const analysis = await ctx.db.get(args.id);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or access denied");
    }

    await ctx.db.delete(args.id);
  },
});