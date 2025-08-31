import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
] as const;
export const jobStatusValidator = v.union(
  ...JOB_STATUSES.map((s) => v.literal(s))
);
export type JobStatus = (typeof JOB_STATUSES)[number];

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      
      // Profile fields
      savedResumeId: v.optional(v.id("_storage")), // saved resume file
      savedResumeName: v.optional(v.string()), // name of saved resume
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"))), // user theme preference
      dreamJobAnalysisId: v.optional(v.id("analyses")), // reference to dream job analysis
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Resume builder table
    resumes: defineTable({
      userId: v.id("users"),
      title: v.string(),
      content: v.string(), // JSON string format from rich text editor
      templateId: v.optional(v.string()), // placeholder for future templates
      lastModified: v.number(),
    }).index("by_user", ["userId"]),

    // Resume analysis table
    analyses: defineTable({
      userId: v.id("users"),
      resumeFileId: v.id("_storage"),
      resumeFileName: v.optional(v.string()), // name of the resume file used
      jobDescription: v.string(),
      matchScore: v.number(), // 0-100
      atsScore: v.number(), // 0-100
      missingKeywords: v.array(v.string()), // top 10 missing keywords

      // ADD: Improvement suggestions for clarity on how to boost scores
      atsImprovements: v.array(v.string()),
      matchingImprovements: v.array(v.string()),
      priorityImprovements: v.array(v.string()), // Most critical changes for maximum impact
      
      // Feature: Deeper Skill-Gap Analysis
      topicsToMaster: v.array(v.object({
        topic: v.string(),
        description: v.string(),
      })),
      
      // Feature: AI Cover Letter
      coverLetter: v.optional(v.string()),

      // Feature: Interview Prep Kit
      interviewQuestions: v.optional(v.array(v.object({
        question: v.string(),
        category: v.string(), // e.g., "Behavioral", "Technical"
      }))),
      interviewTalkingPoints: v.optional(v.array(v.object({
        point: v.string(),
        example: v.string(), // STAR method example
      }))),

      // Feature: Dream Job Analysis
      isDreamJob: v.optional(v.boolean()),
      lackingSkills: v.optional(v.array(v.string())),
      lackingEducation: v.optional(v.array(v.string())),
      lackingExperience: v.optional(v.array(v.string())),
      growthPlan: v.optional(v.array(v.object({
        milestone: v.string(),
        details: v.string(),
        timeline: v.string(),
      }))),

      status: v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      ),
      errorMessage: v.optional(v.string()),
      isFavorited: v.optional(v.boolean()),
      jobApplicationId: v.optional(v.id("jobApplications")),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_job", ["userId", "jobApplicationId"])
      .index("by_user_and_dream_job", ["userId", "isDreamJob"]),

    // Feature: Job Application Tracker
    jobApplications: defineTable({
      userId: v.id("users"),
      jobTitle: v.string(),
      companyName: v.string(),
      status: jobStatusValidator,
      applicationDate: v.optional(v.number()),
      jobDescription: v.optional(v.string()),
      notes: v.optional(v.string()),
      analysisId: v.optional(v.id("analyses")),
      shortlistedDate: v.optional(v.number()),
      interviewDate: v.optional(v.number()),
      offerDate: v.optional(v.number()),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;