import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    savedResumeId: v.optional(v.id("_storage")),
    savedResumeName: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.savedResumeId !== undefined) updates.savedResumeId = args.savedResumeId;
    if (args.savedResumeName !== undefined) updates.savedResumeName = args.savedResumeName;
    if (args.theme !== undefined) updates.theme = args.theme;

    await ctx.db.patch(user._id, updates);
    return await ctx.db.get(user._id);
  },
});

// Get user's saved resume URL
export const getSavedResumeUrl = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || !user.savedResumeId) {
      return null;
    }

    const url = await ctx.storage.getUrl(user.savedResumeId);
    return url;
  },
});