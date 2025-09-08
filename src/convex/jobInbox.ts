"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Ingest a job posting from a URL.
 * - Fetches HTML server-side
 * - Extracts title, company (via og:site_name or hostname), and a plain-text description
 * - Creates a Job Application via existing mutation
 */
export const ingestFromUrl = action({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<{ id: Id<"jobApplications">; jobTitle: string; companyName: string }> => {
    let parsed: URL;
    try {
      parsed = new URL(args.url);
    } catch {
      throw new Error("Please provide a valid URL");
    }

    const res = await fetch(parsed.toString(), {
      // Basic headers to get readable content from most sites
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ResumeAI/1.0; +https://example.com/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch the URL (status ${res.status})`);
    }
    const html = await res.text();

    // Helpers to pull simple fields from HTML
    const getMeta = (name: string, prop = "name") => {
      const re = new RegExp(
        `<meta[^>]+${prop}=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
        "i"
      );
      const m = html.match(re);
      return m?.[1]?.trim() ?? "";
    };

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
    const ogTitle = getMeta("og:title", "property");
    const ogSite = getMeta("og:site_name", "property");
    const twitterTitle = getMeta("twitter:title");

    const jobTitle =
      ogTitle || twitterTitle || titleTag || "Imported Job Posting";

    // Prefer site name for company; fallback to hostname (sans www.)
    const companyName =
      ogSite ||
      parsed.hostname.replace(/^www\./i, "") ||
      "Unknown Company";

    // Very simple plain text extraction: strip scripts/styles/tags
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Trim to a reasonable size for storage/UI
    const jobDescription = cleaned.slice(0, 8000);

    const { api } = await import("./_generated/api");
    const id: Id<"jobApplications"> = await ctx.runMutation(api.jobApplications.createJobApplication, {
      jobTitle,
      companyName,
      jobDescription,
    });

    return { id, jobTitle, companyName };
  },
});
