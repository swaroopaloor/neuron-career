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
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Resume analysis table
    analyses: defineTable({
      userId: v.id("users"),
      resumeFileId: v.id("_storage"),
      resumeFileName: v.optional(v.string()), // name of the resume file used
      jobDescription: v.string(),
      matchScore: v.number(), // 0-100
      atsScore: v.number(), // 0-100
      missingKeywords: v.array(v.string()), // top 10 missing keywords
      topicsToMaster: v.array(v.object({
        topic: v.string(),
        description: v.string(),
      })),
      status: v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      ),
      errorMessage: v.optional(v.string()),
      isFavorited: v.optional(v.boolean()),
    })
      .index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;