import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createResume = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resumeId = await ctx.db.insert("resumes", {
      userId,
      title: args.title,
      content: args.content || JSON.stringify({
        personalInfo: { name: "", email: "", phone: "", location: "" },
        summary: "",
        experience: [],
        education: [],
        skills: [],
      }),
      templateId: args.templateId,
      lastModified: Date.now(),
    });

    return resumeId;
  },
});

export const updateResume = mutation({
  args: {
    resumeId: v.id("resumes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found or access denied");
    }

    const updates: any = {
      lastModified: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.templateId !== undefined) updates.templateId = args.templateId;

    await ctx.db.patch(args.resumeId, updates);
    return args.resumeId;
  },
});

export const getResume = query({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.userId !== userId) {
      return null;
    }

    return resume;
  },
});

export const listResumes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return resumes;
  },
});

export const deleteResume = mutation({
  args: { resumeId: v.id("resumes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found or access denied");
    }

    await ctx.db.delete(args.resumeId);
    return true;
  },
});
