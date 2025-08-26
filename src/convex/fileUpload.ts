import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Generate upload URL for resume PDF
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User must be authenticated to generate an upload URL.");
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
      throw new Error("User must be authenticated to retrieve a file URL.");
    }

    const url = await ctx.storage.getUrl(args.fileId);
    if (!url) {
      throw new Error(`File with ID ${args.fileId} not found or URL could not be generated.`);
    }
    return url;
  },
});