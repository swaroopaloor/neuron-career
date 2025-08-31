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

// Get detailed analytics for the user
export const getDetailedAnalytics = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to view analytics.");
    }

    const allAnalyses = await ctx.db
      .query("analyses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const completedAnalyses = allAnalyses.filter(a => a.status === "completed");
    const totalAnalyses = allAnalyses.length;
    const totalCompleted = completedAnalyses.length;

    // Calculate averages
    const avgMatchScore = completedAnalyses.length > 0 
      ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.matchScore, 0) / completedAnalyses.length)
      : 0;
    
    const avgAtsScore = completedAnalyses.length > 0 
      ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.atsScore, 0) / completedAnalyses.length)
      : 0;

    // Success metrics
    const highMatchAnalyses = completedAnalyses.filter(a => a.matchScore >= 80).length;
    const excellentAtsAnalyses = completedAnalyses.filter(a => a.atsScore >= 90).length;
    const successRate = completedAnalyses.length > 0 
      ? Math.round((highMatchAnalyses / completedAnalyses.length) * 100)
      : 0;

    // Unique counts
    const uniqueResumes = new Set(allAnalyses.map(a => a.resumeFileId)).size;
    const uniqueJobDescriptions = new Set(allAnalyses.map(a => a.jobDescription)).size;

    // Time-based analytics (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentAnalyses = allAnalyses.filter(a => a._creationTime >= thirtyDaysAgo);
    const recentCompleted = recentAnalyses.filter(a => a.status === "completed");

    // Weekly breakdown (last 4 weeks)
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = Date.now() - ((i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = Date.now() - (i * 7 * 24 * 60 * 60 * 1000);
      const weekAnalyses = allAnalyses.filter(a => 
        a._creationTime >= weekStart && a._creationTime < weekEnd
      );
      const weekCompleted = weekAnalyses.filter(a => a.status === "completed");
      const weekAvgMatch = weekCompleted.length > 0 
        ? Math.round(weekCompleted.reduce((sum, a) => sum + a.matchScore, 0) / weekCompleted.length)
        : 0;

      weeklyData.push({
        week: `Week ${4 - i}`,
        analyses: weekAnalyses.length,
        completed: weekCompleted.length,
        avgMatchScore: weekAvgMatch
      });
    }

    return {
      totalAnalyses,
      totalCompleted,
      avgMatchScore,
      avgAtsScore,
      highMatchAnalyses,
      excellentAtsAnalyses,
      successRate,
      uniqueResumes,
      uniqueJobDescriptions,
      recentAnalyses: recentAnalyses.length,
      recentCompleted: recentCompleted.length,
      weeklyData,
      favoriteAnalyses: allAnalyses.filter(a => a.isFavorited).length,
      failedAnalyses: allAnalyses.filter(a => a.status === "failed").length
    };
  },
});

// Set an analysis as the user's dream job
export const setDreamJobAnalysis = mutation({
  args: { analysisId: v.id("analyses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to set a dream job.");
    }

    // Verify the analysis belongs to the user
    const analysis = await ctx.db.get(args.analysisId);
    if (!analysis || analysis.userId !== user._id) {
      throw new Error("Analysis not found or user does not have permission.");
    }

    // If user already has a dream job, unset it
    if (user.dreamJobAnalysisId) {
      const currentDreamJob = await ctx.db.get(user.dreamJobAnalysisId);
      if (currentDreamJob) {
        await ctx.db.patch(user.dreamJobAnalysisId, { isDreamJob: false });
      }
    }

    // Set the new dream job
    await ctx.db.patch(args.analysisId, { isDreamJob: true });
    await ctx.db.patch(user._id, { dreamJobAnalysisId: args.analysisId });

    return args.analysisId;
  },
});

// Get the user's dream job analysis
export const getDreamJobAnalysis = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    if (!user.dreamJobAnalysisId) {
      return null;
    }

    const dreamJobAnalysis = await ctx.db.get(user.dreamJobAnalysisId);
    if (!dreamJobAnalysis || dreamJobAnalysis.userId !== user._id) {
      return null;
    }

    return dreamJobAnalysis;
  },
});

// Remove dream job status
export const removeDreamJob = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated.");
    }

    if (user.dreamJobAnalysisId) {
      const dreamJobAnalysis = await ctx.db.get(user.dreamJobAnalysisId);
      if (dreamJobAnalysis) {
        await ctx.db.patch(user.dreamJobAnalysisId, { isDreamJob: false });
      }
      await ctx.db.patch(user._id, { dreamJobAnalysisId: undefined });
    }
  },
});