"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

export const generateCareerPlan = action({
  args: {
    about: v.string(),
    dreamRole: v.string(),
    weeks: v.number(),
    // Add: user calibration inputs
    currentLevel: v.string(),
    yearsExperience: v.number(),
    hoursPerWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const prompt = `You are a principal career mentor and curriculum designer. Generate a highly accurate, realistic, and actionable career plan calibrated to the user's CURRENT LEVEL, YEARS OF EXPERIENCE, AVAILABLE HOURS/WEEK, and DREAM ROLE.

User Background (verbatim): ${args.about}
Current Level: ${args.currentLevel}
Years of Experience: ${args.yearsExperience}
Available Time: ${args.hoursPerWeek} hours/week
Dream Role: ${args.dreamRole}
Timeline: ${args.weeks} weeks

Very important guidance:
- Calibrate depth and complexity to the user's level (${args.currentLevel}) and years (${args.yearsExperience}).
- If the dream role relates to "software", "SWE", "frontend", "backend", "fullstack", or "mobile":
  - Prioritize role-specific topics like: Algorithms & Data Structures (DSA), Language Mastery (select the most relevant languages for the role), System Design (HLD + LLD), Testing (unit/integration/e2e), Tooling (Git, Docker), CI/CD, Cloud & Deployment basics, Performance & Observability, Security basics, and real Portfolio Projects.
  - Ensure weekly deliverables include coding tasks, katas, LeetCode/NeetCode sets, system design prompts, and tangible outputs (repos, READMEs, small services, UI components).
- Avoid generic platitudes. Every task must be concrete, measurable, and produce an artifact.

Strict output format: Return ONLY a JSON object with EXACTLY these fields and structure:

{
  "topics": ["role-specific-topic1", "role-specific-topic2", "... 8-12 total"],
  "courses": [
    { "title": "Real Course Name", "provider": "Platform/Provider", "url": "https://actual-course-url.com" }
  ],
  "certifications": ["cert1", "cert2", "... (if relevant)"],
  "timeline": [
    {
      "week": 1,
      "focus": "Provide 4-6 concrete action items. Each bullet MUST:
- start with '- '
- include a deliverable (repo, README, doc, quiz score, etc.)
- include a resource or link where possible
- include an estimated time in parentheses like '(2h)'
Examples:
- Complete NeetCode 'Arrays & Strings' easy set (3h): https://neetcode.io/roadmap
- Implement a CLI tool in ${args.currentLevel === "Junior" ? "TypeScript" : "a language of choice"} and write unit tests (3h), repo with README
- Watch 'System Design Basics' and summarize key tradeoffs in a 1-page note (2h): https://..."
    }
  ],
  "summary": "2-3 motivating sentences summarizing the plan and expected outcomes"
}

Requirements:
- Topics MUST be role-specific to "${args.dreamRole}" and not generic. Prefer concrete skills/tools (e.g., 'DSA: Arrays, Hashing, Two Pointers', 'System Design: caching, queues, load balancing', 'Frontend: React hooks, state mgmt, performance', 'Backend: REST, auth, SQL/NoSQL, ORMs').
- Courses MUST be real with accurate URLs (Coursera, edX, Udemy, Pluralsight, Frontend Masters, Educative, O'Reilly, etc.).
- Ensure workload fits ${args.hoursPerWeek} hours/week. Do not overload.
- Timeline MUST have exactly ${args.weeks} weeks.
- Return ONLY the JSON object, no extra text, no markdown, no code fences.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2600,
          temperature: 0.2,
          response_format: { type: "json_object" }, // ensure valid JSON
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const contentRaw = data?.choices?.[0]?.message?.content;
      if (!contentRaw || typeof contentRaw !== "string") {
        throw new Error("No content received from AI");
      }

      // Robust JSON extraction: handle cases with extra text or code fences
      let jsonText = contentRaw.trim();
      if (!jsonText.startsWith("{")) {
        const start = jsonText.indexOf("{");
        const end = jsonText.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          jsonText = jsonText.slice(start, end + 1);
        }
      }

      let plan: any;
      try {
        plan = JSON.parse(jsonText);
      } catch (e) {
        throw new Error("Failed to parse AI JSON response");
      }

      // Validate structure
      if (!plan.topics || !plan.courses || !plan.certifications || !plan.timeline || !plan.summary) {
        throw new Error("Invalid plan structure received from AI");
      }

      return plan;
    } catch (error) {
      console.error("Error generating career plan (Groq):", error);

      const isSWE = /software|swe|engineer|frontend|backend|full[- ]?stack|mobile/i.test(
        args.dreamRole || ""
      );

      const topics = isSWE
        ? [
            "Algorithms & Data Structures: Arrays, Hashing, Two Pointers, Stack/Queue, Sliding Window, Trees, Graphs",
            "Language Mastery: TypeScript/JavaScript (syntax, types, async, patterns)",
            "System Design: Caching, Queues, Load Balancing, Databases, CAP tradeoffs",
            "Databases: SQL vs NoSQL, indexing, query optimization, transactions",
            "APIs & Backend: REST, Auth, Pagination, Rate Limiting, Error Handling",
            "Testing: Unit, Integration, E2E; Jest/Vitest + Testing Library",
            "DevOps Basics: Git, CI/CD, Docker; Env config & secrets",
            "Performance & Observability: profiling, logs, metrics, tracing",
            "Security Essentials: OWASP Top 10, input validation, auth flows",
            "Portfolio Projects: real-world apps with clear READMEs and demos",
          ]
        : [
            "Role-specific fundamentals",
            "Intermediate skill-building",
            "Practical projects",
            "Tooling & workflows",
            "Interview preparation",
            "Continuous learning",
          ];

      const courses = isSWE
        ? [
            {
              title: "Algorithms Specialization",
              provider: "Coursera (Stanford/Princeton options)",
              url: "https://www.coursera.org/specializations/algorithms",
            },
            {
              title: "Grokking Modern System Design Interview",
              provider: "Educative",
              url: "https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers",
            },
            {
              title: "TypeScript: The Complete Developer's Guide",
              provider: "Udemy",
              url: "https://www.udemy.com/course/typescript-the-complete-developers-guide/",
            },
            {
              title: "Testing JavaScript (Jest + Testing Library)",
              provider: "O'Reilly (or equivalent)",
              url: "https://www.oreilly.com/search/?query=testing%20javascript%20jest",
            },
          ]
        : [
            {
              title: "Career Development Fundamentals",
              provider: "Coursera",
              url: "https://www.coursera.org/specializations/career-success",
            },
            {
              title: "Professional Skills Development",
              provider: "LinkedIn Learning",
              url: "https://www.linkedin.com/learning/topics/professional-development",
            },
          ];

      const certifications = isSWE
        ? ["AWS Certified Cloud Practitioner (if cloud-focused)", "Any language/framework-specific cert if relevant"]
        : ["Relevant industry certification"];

      // SWE-aware weekly plan with concrete, linked tasks
      const timeline = Array.from({ length: args.weeks }, (_, i) => {
        const week = i + 1;
        const hrs = args.hoursPerWeek;
        if (isSWE) {
          // Calibrate phases roughly
          let phase: "DSA" | "Lang" | "Backend" | "SystemDesign" | "Project" | "Interview" =
            "Lang";
          if (week <= 3) phase = "DSA";
          else if (week <= 5) phase = "Lang";
          else if (week <= 7) phase = "Backend";
          else if (week <= 9) phase = "SystemDesign";
          else if (week <= Math.max(10, args.weeks - 2)) phase = "Project";
          else phase = "Interview";

          const bulletsByPhase: Record<string, string[]> = {
            DSA: [
              `- Solve 12 NeetCode easy problems: Arrays/Strings (${Math.max(4, Math.round(hrs * 0.5))}h): https://neetcode.io/roadmap`,
              `- Write notes on patterns (two pointers, hashing) in a Gist (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Implement 2 classic problems from scratch in ${args.currentLevel === "Junior" ? "TypeScript" : "your primary language"} with tests (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Reflection post: key mistakes + fixes (${Math.max(1, Math.round(hrs * 0.1))}h)`,
            ],
            Lang: [
              `- Complete advanced TS modules (types, generics, utility types) (${Math.max(3, Math.round(hrs * 0.4))}h): https://www.typescriptlang.org/docs/`,
              `- Build a CLI or small library and publish to GitHub with a README (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Add unit tests with Jest/Vitest and achieve 80%+ coverage (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Document learnings in README and a short post (${Math.max(1, Math.round(hrs * 0.1))}h)`,
            ],
            Backend: [
              `- Build a REST API with auth, pagination, and error handling (${Math.max(3, Math.round(hrs * 0.4))}h)`,
              `- Add a SQL database; create indexes, write 3 optimized queries (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Containerize with Docker and add a CI pipeline (GitHub Actions) (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Write integration tests and a load test baseline (${Math.max(1, Math.round(hrs * 0.1))}h)`,
            ],
            SystemDesign: [
              `- Study caching, queues, load balancing basics (${Math.max(2, Math.round(hrs * 0.3))}h): https://github.com/donnemartin/system-design-primer`,
              `- Do 2 system design prompts (URL shortener, rate limiter) and write HLD docs (${Math.max(2, Math.round(hrs * 0.3))}h)`,
              `- Implement one component (e.g., rate limiter) as a microservice with README (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Share notes + diagrams (PlantUML/Mermaid) (${Math.max(1, Math.round(hrs * 0.1))}h)`,
            ],
            Project: [
              `- Scope a portfolio project tied to ${args.dreamRole}; define features & milestones (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Implement key feature(s) with tests and CI (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Add observability: logs + metrics; measure one perf metric (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Polish README with screenshots, setup, and demo link (${Math.max(1, Math.round(hrs * 0.1))}h)`,
            ],
            Interview: [
              `- 10 DSA problems (mixed difficulty) and review mistakes (${Math.max(3, Math.round(hrs * 0.45))}h): https://leetcode.com`,
              `- 1 system design mock; write tradeoffs and bottlenecks (${Math.max(2, Math.round(hrs * 0.3))}h)`,
              `- Behavioral STAR stories draft + refinement (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Resume refresh to highlight project impact and metrics (${Math.max(1, Math.round(hrs * 0.1))}h)`,
            ],
          };

          return {
            week,
            focus: bulletsByPhase[phase].join("\n"),
          };
        }

        // Non-SWE generic but actionable fallback
        let phase = "Foundation Building";
        if (i >= 4 && i < 8) phase = "Skill Development";
        else if (i >= 8 && i < 12) phase = "Project Implementation";
        else if (i >= 12) phase = "Interview Preparation";
        return {
          week,
          focus:
            phase === "Foundation Building"
              ? `- Complete 2-3 foundational lessons with notes (${Math.max(2, Math.round(hrs * 0.5))}h)
- Build a tiny exercise applying new concepts (${Math.max(2, Math.round(hrs * 0.3))}h)
- Summarize learnings in a short post (${Math.max(1, Math.round(hrs * 0.2))}h)`
              : phase === "Skill Development"
              ? `- Deep-dive into an intermediate module (${Math.max(3, Math.round(hrs * 0.5))}h)
- Implement 1-2 features in a sample project (${Math.max(2, Math.round(hrs * 0.3))}h)
- Create flashcards for key concepts (${Math.max(1, Math.round(hrs * 0.2))}h)`
              : phase === "Project Implementation"
              ? `- Define scope for a portfolio-ready project (${Math.max(1, Math.round(hrs * 0.15))}h)
- Build and document an MVP (${Math.max(3, Math.round(hrs * 0.55))}h)
- Add README with screenshots and instructions (${Math.max(1, Math.round(hrs * 0.2))}h)`
              : `- Refresh fundamentals with quick quizzes (${Math.max(2, Math.round(hrs * 0.35))}h)
- Practice 2-3 mock interviews (${Math.max(2, Math.round(hrs * 0.35))}h)
- Polish resume and profile with project highlights (${Math.max(1, Math.round(hrs * 0.3))}h)`,
        };
      });

      return {
        topics,
        courses,
        certifications,
        timeline,
        summary: `Personalized ${args.weeks}-week plan aligned to ${args.dreamRole ||
          "your target role"} (~${args.hoursPerWeek}h/week). Calibrated to ${args.currentLevel} with concrete weekly outputs and links.`,
      };
    }
  },
});