import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Generate upload URL for resume PDF
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Get file URL for viewing/downloading
export const getFileUrl = mutation({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await ctx.storage.getUrl(args.fileId);
  },
});
