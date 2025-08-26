import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { jobStatusValidator } from "./schema";

// Get all job applications for the current user
export const getJobApplications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    return await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Create a new job application
export const createJobApplication = mutation({
  args: {
    jobTitle: v.string(),
    companyName: v.string(),
    jobDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const jobApplicationId = await ctx.db.insert("jobApplications", {
      userId: user._id,
      jobTitle: args.jobTitle,
      companyName: args.companyName,
      jobDescription: args.jobDescription,
      status: "Saved",
      applicationDate: Date.now(),
    });

    return jobApplicationId;
  },
});

// Update a job application's details or status
export const updateJobApplication = mutation({
  args: {
    id: v.id("jobApplications"),
    jobTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    status: v.optional(jobStatusValidator),
    jobDescription: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { id, ...updates } = args;

    const existingApplication = await ctx.db.get(id);
    if (!existingApplication || existingApplication.userId !== user._id) {
      throw new Error("Application not found or access denied");
    }

    await ctx.db.patch(id, updates);
  },
});

// Delete a job application
export const deleteJobApplication = mutation({
  args: { id: v.id("jobApplications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("User not authenticated");
    }

    const existingApplication = await ctx.db.get(args.id);
    if (!existingApplication || existingApplication.userId !== user._id) {
      throw new Error("Application not found or access denied");
    }

    // Also delete the associated analysis if it exists
    if (existingApplication.analysisId) {
      await ctx.db.delete(existingApplication.analysisId);
    }

    await ctx.db.delete(args.id);
  },
});
