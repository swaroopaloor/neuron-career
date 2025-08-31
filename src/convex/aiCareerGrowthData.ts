import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const updateAnalysisWithInsights = internalMutation({
  args: {
    analysisId: v.id("analyses"),
    lackingSkills: v.array(v.string()),
    lackingEducation: v.array(v.string()),
    lackingExperience: v.array(v.string()),
    growthPlan: v.array(
      v.object({
        milestone: v.string(),
        details: v.string(),
        timeline: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { analysisId, ...updates } = args;
    await ctx.db.patch(analysisId, updates);
  },
});
