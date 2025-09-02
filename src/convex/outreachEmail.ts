"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const sendEmailToContact = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";

    if (!apiKey) {
      throw new Error("Resend API key is not configured. Please set RESEND_API_KEY in Convex environment variables.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [args.to],
        subject: args.subject,
        text: args.body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send email via Resend: ${res.status} ${text}`);
    }

    return await res.json();
  },
});

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@yourdomain.com";

    if (!apiKey) {
      throw new Error("Resend API key is not configured. Please set RESEND_API_KEY in Convex environment variables.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [args.to],
        subject: args.subject,
        text: args.body,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send email via Resend: ${res.status} ${text}`);
    }

    return await res.json();
  },
});