import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { internalMutation } from "./_generated/server";
import { action } from "./_generated/server";
import { api } from "@/convex/_generated/api";

// Shared validators
const contactValidator = v.object({
  name: v.string(),
  email: v.optional(v.string()),
  company: v.optional(v.string()),
  title: v.optional(v.string()),
  connectionDegree: v.union(v.literal(1), v.literal(2), v.literal(3)), // 1st, 2nd, 3rd+
  relationshipStrength: v.number(), // 1-5
  lastContactedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
});

const targetCompanyValidator = v.object({
  companyName: v.string(),
  targetRole: v.optional(v.string()),
  priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
});

const sequenceMessageValidator = v.object({
  type: v.union(v.literal("email"), v.literal("dm")),
  subject: v.optional(v.string()),
  body: v.string(),
  sentAt: v.optional(v.number()),
  status: v.optional(v.union(v.literal("draft"), v.literal("queued"), v.literal("sent"), v.literal("failed"))),
});

export const addContact = mutation({
  args: { contact: contactValidator },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const id = await ctx.db.insert("contacts", {
      userId: user._id,
      ...args.contact,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const listContacts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const results = await ctx.db.query("contacts").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").collect();
    return results;
  },
});

export const addTargetCompany = mutation({
  args: { target: targetCompanyValidator },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const id = await ctx.db.insert("targetCompanies", {
      userId: user._id,
      ...args.target,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const listTargetCompanies = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const results = await ctx.db.query("targetCompanies").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").collect();
    return results;
  },
});

// Heuristic referral likelihood computation
function computeReferralLikelihood(params: {
  contactCompany?: string;
  targetCompany: string;
  connectionDegree: 1 | 2 | 3;
  relationshipStrength: number; // 1-5
  lastContactedAt?: number;
}) {
  let score = 0;

  // Base by degree
  const degreeBase = params.connectionDegree === 1 ? 0.8 : params.connectionDegree === 2 ? 0.6 : 0.3;
  score += degreeBase;

  // Company match boost
  if (params.contactCompany && params.contactCompany.toLowerCase() === params.targetCompany.toLowerCase()) {
    score += 0.25;
  }

  // Relationship strength scaled (max +0.3)
  score += Math.min(params.relationshipStrength / 5 * 0.3, 0.3);

  // Recency bonus (contacted in last 90 days -> up to +0.15)
  if (params.lastContactedAt) {
    const days = (Date.now() - params.lastContactedAt) / (1000 * 60 * 60 * 24);
    if (days <= 7) score += 0.15;
    else if (days <= 30) score += 0.12;
    else if (days <= 90) score += 0.08;
  }

  // Clamp 0-1
  score = Math.max(0, Math.min(1, score));
  // Return 0-100
  return Math.round(score * 100);
}

export const suggestContactsForCompany = query({
  args: { companyName: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const contacts = await ctx.db.query("contacts").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();

    const ranked = contacts
      .map((c) => ({
        contact: c,
        referralLikelihood: computeReferralLikelihood({
          contactCompany: c.company,
          targetCompany: args.companyName,
          connectionDegree: c.connectionDegree as 1 | 2 | 3,
          relationshipStrength: c.relationshipStrength,
          lastContactedAt: c.lastContactedAt,
        }),
      }))
      .sort((a, b) => b.referralLikelihood - a.referralLikelihood)
      .slice(0, 10);

    return ranked;
  },
});

export const createOutreachSequence = mutation({
  args: {
    contactId: v.id("contacts"),
    companyName: v.string(),
    targetRole: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("dm")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const contact = await ctx.db.get(args.contactId);
    if (!contact || contact.userId !== user._id) throw new Error("Contact not found");

    const you = user.name ?? "there";
    const role = args.targetRole ?? "a role";
    const intro = `Hi ${contact.name?.split(" ")[0] || "there"},`;
    const contextLine = contact.company?.toLowerCase() === args.companyName.toLowerCase()
      ? `Noticed you're at ${args.companyName} — I'm exploring ${role} opportunities there.`
      : `I'm exploring ${role} opportunities at ${args.companyName} and saw you're well-connected in the space.`;
    const ask = contact.connectionDegree === 1
      ? "Would you be open to a quick 10-min chat or a referral if it feels like a fit?"
      : "If comfortable, would you introduce me to someone on the team for context or a referral?";
    const close = "Happy to share a concise resume and tailored summary. Appreciate it!";
    const signoff = `— ${you}`;

    const emailSubject = `[Warm Intro] ${role} @ ${args.companyName}`;
    const emailBody =
      `${intro}

${contextLine}
I've been working on outcomes like:
• [Add 1-2 quantified wins relevant to the team]
• [Add 1-2 relevant tools/stack highlights]

${ask}
${close}

${signoff}`;

    const dmBody =
      `${intro} ${contextLine} A quick intro or pointer would mean a lot — can I send a 1-pager? ${signoff}`;

    const messages = [
      {
        type: args.channel,
        subject: args.channel === "email" ? emailSubject : undefined,
        body: args.channel === "email" ? emailBody : dmBody,
        status: "draft" as const,
      },
      {
        type: args.channel,
        subject: args.channel === "email" ? `Quick follow-up: ${role} @ ${args.companyName}` : undefined,
        body:
          args.channel === "email"
            ? `Hi ${contact.name?.split(" ")[0] || "there"},\n\nJust wanted to float this to the top of your inbox — would value your quick take. If it's easier, a simple "yes/no" works and I'll take it from there.\n\nThanks!\n${signoff}`
            : `Bumping this in case it got buried — would love a quick steer. Thanks! ${signoff}`,
        status: "draft" as const,
      },
    ];

    const referralLikelihood = computeReferralLikelihood({
      contactCompany: contact.company,
      targetCompany: args.companyName,
      connectionDegree: contact.connectionDegree as 1 | 2 | 3,
      relationshipStrength: contact.relationshipStrength,
      lastContactedAt: contact.lastContactedAt,
    });

    const id = await ctx.db.insert("outreachSequences", {
      userId: user._id,
      contactId: contact._id,
      companyName: args.companyName,
      targetRole: args.targetRole,
      channel: args.channel,
      messages,
      status: "draft",
      referralLikelihood,
      nextFollowUpAt: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days
      createdAt: Date.now(),
    });

    return id;
  },
});

export const listSequences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const results = await ctx.db.query("outreachSequences").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").collect();
    return results;
  },
});

export const updateSequenceStatus = mutation({
  args: {
    sequenceId: v.id("outreachSequences"),
    status: v.union(v.literal("draft"), v.literal("in_progress"), v.literal("completed"), v.literal("paused")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const seq = await ctx.db.get(args.sequenceId);
    if (!seq || seq.userId !== user._id) throw new Error("Not found");
    await ctx.db.patch(seq._id, { status: args.status });
    return true;
  },
});

export const scheduleFollowUp = mutation({
  args: { sequenceId: v.id("outreachSequences"), nextFollowUpAt: v.number() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const seq = await ctx.db.get(args.sequenceId);
    if (!seq || seq.userId !== user._id) throw new Error("Not found");
    await ctx.db.patch(seq._id, { nextFollowUpAt: args.nextFollowUpAt });
    return true;
  },
});

// Seed test data for quick UX testing
export const seedTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db.query("contacts").withIndex("by_user", (q) => q.eq("userId", user._id)).take(1);
    if (existing.length > 0) return "already_seeded";

    const now = Date.now();
    const contacts = [
      {
        name: "Priya Sharma",
        email: "priya@example.com",
        company: "Acme Corp",
        title: "Engineering Manager",
        connectionDegree: 2 as const,
        relationshipStrength: 4,
        lastContactedAt: now - 10 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Alex Johnson",
        email: "alex@example.com",
        company: "Globex",
        title: "Senior Recruiter",
        connectionDegree: 1 as const,
        relationshipStrength: 5,
        lastContactedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
      {
        name: "Mei Chen",
        email: "mei@example.com",
        company: "Acme Corp",
        title: "Staff Engineer",
        connectionDegree: 3 as const,
        relationshipStrength: 3,
      },
    ];
    for (const c of contacts) {
      await ctx.db.insert("contacts", { userId: user._id, ...c, createdAt: now });
    }
    await ctx.db.insert("targetCompanies", { userId: user._id, companyName: "Acme Corp", targetRole: "Senior Frontend Engineer", priority: "high", createdAt: now });

    return "seeded";
  },
});

export const insertGeneratedContacts = internalMutation({
  args: {
    companyName: v.string(),
    contacts: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        title: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Build a set of emails for fast lookup
    const emails = Array.from(
      new Set(
        args.contacts
          .map((c) => c.email?.toLowerCase().trim())
          .filter((e): e is string => !!e),
      ),
    );

    // Fetch existing contacts by email for dedupe (only if we have emails)
    const existingByEmail = new Map<string, any>();
    if (emails.length > 0) {
      // Query per email via index (Convex requires index field order)
      for (const email of emails) {
        const existing = await ctx.db
          .query("contacts")
          .withIndex("by_user_and_email", (q) => q.eq("userId", user._id).eq("email", email))
          .take(1);
        if (existing.length > 0) {
          existingByEmail.set(email, existing[0]);
        }
      }
    }

    let inserted = 0;
    const now = Date.now();

    for (const c of args.contacts) {
      const emailKey = c.email?.toLowerCase().trim();
      if (emailKey && existingByEmail.has(emailKey)) {
        // Already have this email—skip
        continue;
      }
      await ctx.db.insert("contacts", {
        userId: user._id,
        name: c.name,
        email: c.email,
        company: args.companyName,
        title: c.title,
        connectionDegree: 2, // reasonable default for generated leads
        relationshipStrength: 3, // neutral default
        createdAt: now,
      });
      inserted++;
    }

    return { inserted };
  },
});

export const generateContactsForCompany = action({
  args: {
    companyName: v.string(),
    titleHint: v.optional(v.string()),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    const result = await ctx.runAction(
      api.outreachAuto.generateContactsForCompany,
      args
    ) as { inserted: number };
    return result;
  },
});