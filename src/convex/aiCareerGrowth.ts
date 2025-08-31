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

    // Normalize level for consistent logic
    const level = (args.currentLevel || "").toLowerCase();

    // Generalized, domain-agnostic instructions (system) to ensure accuracy for ANY role
    const systemPrompt = `You are an expert career architect and curriculum designer.
Objectives:
- Infer the exact domain/industry and sub-specialty directly from the dream role and background (examples: healthcare, finance, legal, trades, arts, sales, marketing, HR, operations, customer support, manufacturing, logistics, hospitality, education, research, government, non-profit, etc.).
- Be precise, concrete, and measurable. Avoid fluff and platitudes.
- Use reputable, real resources with working URLs; avoid placeholders or vague sites like "example.com".
- For each week, provide 4–6 bullets, each with: (1) a concrete deliverable, (2) a resource link where possible, and (3) a time estimate in parentheses like "(2h)".
- Respect the user's weekly time budget and produce exactly the requested number of weeks.
- Output strictly valid JSON that matches the required schema with no extra text or markdown.`;

    // User-specific context and strict schema - works for any role
    const prompt = `You are a principal career mentor and curriculum designer. Generate a highly accurate, realistic, and actionable career plan calibrated to the user's CURRENT LEVEL, YEARS OF EXPERIENCE, AVAILABLE HOURS/WEEK, and DREAM ROLE — in ANY FIELD.

User Background (verbatim): ${args.about}
Current Level: ${level}
Years of Experience: ${args.yearsExperience}
Available Time: ${args.hoursPerWeek} hours/week
Dream Role: ${args.dreamRole}
Timeline: ${args.weeks} weeks

Constraints:
- Topics must be domain-specific and skill-oriented (10–14 items) and avoid generic platitudes.
- Courses must be real with accurate URLs from reputable providers (Coursera, edX, Udemy, LinkedIn Learning, O'Reilly, Pluralsight, Datacamp, vendor academies, reputable bootcamps, etc.).
- Each week's "focus" must include 4–6 bullets that:
  - start with "- "
  - include a concrete deliverable (repo, README, doc, case study, portfolio artifact, score)
  - include a resource or link where possible
  - include an estimated time in parentheses like "(2h)"
- Calibrate depth and complexity to the user's level (${level}) and years (${args.yearsExperience}), and keep the total weekly workload within ~${args.hoursPerWeek}h/week.
- Timeline MUST have exactly ${args.weeks} weeks.
- Ensure the plan clearly maps to the real responsibilities, tooling, and competencies of the target role and industry.
- Do NOT include placeholders, fake URLs, or vague advice.

Strict output format: Return ONLY a JSON object with EXACTLY these fields and structure:

{
  "topics": ["role-specific-topic1", "role-specific-topic2", "... 10-14 total"],
  "courses": [
    { "title": "Real Course Name", "provider": "Platform/Provider", "url": "https://actual-course-url.com" }
  ],
  "certifications": ["cert1", "cert2", "... (if relevant)"],
  "timeline": [
    {
      "week": 1,
      "focus": "- item1 (xh): https://link\\n- item2 (xh): https://link\\n- item3 (xh)\\n- item4 (xh)"
    }
  ],
  "summary": "2–3 motivating sentences summarizing the plan and expected outcomes"
}

Return ONLY the JSON object, no extra text, no markdown, no code fences.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          max_tokens: 2600,
          temperature: 0.1,
          top_p: 0.9,
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

      // Enforce exactly args.weeks in timeline; fill gaps with actionable generic items aligned to the target role
      if (Array.isArray(plan.timeline)) {
        if (plan.timeline.length > args.weeks) {
          plan.timeline = plan.timeline.slice(0, args.weeks);
        } else if (plan.timeline.length < args.weeks) {
          const start = plan.timeline.length;
          const genericFocus = [
            `- Close skill gaps toward ${args.dreamRole} with 2–3 targeted lessons (${Math.max(2, Math.round(args.hoursPerWeek * 0.4))}h)`,
            `- Produce a tangible artifact (repo/case study/doc) (${Math.max(1, Math.round(args.hoursPerWeek * 0.3))}h)`,
            `- Apply learning using role-specific tools/methods (${Math.max(1, Math.round(args.hoursPerWeek * 0.2))}h)`,
            `- Reflect, track outcomes, and plan next steps (${Math.max(1, Math.round(args.hoursPerWeek * 0.1))}h)`
          ].join("\n");
          for (let w = start; w < args.weeks; w++) {
            plan.timeline.push({ week: w + 1, focus: genericFocus });
          }
        }
      }

      return plan;
    } catch (error) {
      console.error("Error generating career plan (Groq):", error);

      // Domain detection from role/background
      const text = `${args.dreamRole} ${args.about}`.toLowerCase();
      const isSWE = /(software|swe|frontend|back[- ]?end|full[- ]?stack|mobile|devops|cloud|qa|test|engineering)/i.test(args.dreamRole || "");
      const isDS  = /(data scientist|machine learning|ml|ai(?!.*product)|deep learning|analytics)/i.test(text);
      const isPM  = /(product manager|product management|pm|product owner)/i.test(text);
      const isSEC = /(cyber|security|infosec|soc|pentest|penetration|blue team|red team)/i.test(text);
      const isUX  = /(ux|ui|designer|product design|interaction design|visual design)/i.test(text);
      const isMKT = /(marketing|growth|seo|sem|ppc|content|ads|campaign)/i.test(text);

      // Fallback topics/courses/certs per domain
      let topics: string[] = [];
      let courses: Array<{ title: string; provider: string; url: string }> = [];
      let certifications: string[] = [];

      if (isSWE) {
        topics = [
          "Algorithms & Data Structures: Arrays, Hashing, Two Pointers, Stack/Queue, Trees, Graphs",
          "Language Mastery: TypeScript/JavaScript (syntax, types, async, patterns)",
          "System Design: Caching, Queues, Load Balancing, Databases, CAP tradeoffs",
          "APIs & Backend: REST, Auth, Pagination, Rate Limiting, Error Handling",
          "Databases: SQL vs NoSQL, indexing, query optimization, transactions",
          "Testing: Unit, Integration, E2E; Jest/Vitest + Testing Library",
          "DevOps Basics: Git, CI/CD, Docker; Env config & secrets",
          "Performance & Observability: profiling, logs, metrics, tracing",
          "Security Essentials: OWASP Top 10, input validation, auth flows",
          "Portfolio Projects: real-world apps with clear READMEs and demos"
        ];
        courses = [
          { title: "Algorithms Specialization", provider: "Coursera", url: "https://www.coursera.org/specializations/algorithms" },
          { title: "Grokking Modern System Design Interview", provider: "Educative", url: "https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers" },
          { title: "TypeScript: The Complete Developer's Guide", provider: "Udemy", url: "https://www.udemy.com/course/typescript-the-complete-developers-guide/" }
        ];
        certifications = ["AWS Certified Cloud Practitioner (optional)", "Language/framework cert if relevant"];
      } else if (isDS) {
        topics = [
          "Python for Data: NumPy, Pandas, data cleaning",
          "Exploratory Data Analysis & Visualization: Matplotlib, Seaborn/Plotly",
          "Statistics & Probability for ML",
          "ML Algorithms: Linear/Logistic Regression, Trees, Ensembles, SVMs, Clustering",
          "Model Evaluation & Validation: cross-validation, metrics",
          "Feature Engineering & Pipelines: scikit-learn",
          "Intro to Deep Learning: PyTorch or TensorFlow",
          "SQL for Analytics and Warehousing",
          "MLOps Basics: reproducibility, experiment tracking",
          "Portfolio: notebooks, reports, dashboards"
        ];
        courses = [
          { title: "Applied Data Science with Python", provider: "Coursera (UMich)", url: "https://www.coursera.org/specializations/data-science-python" },
          { title: "Machine Learning Specialization", provider: "Coursera (Andrew Ng)", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
          { title: "Deep Learning with PyTorch", provider: "Udacity", url: "https://www.udacity.com/course/deep-learning-pytorch--ud188" }
        ];
        certifications = ["Google Professional Data Engineer (optional)"];
      } else if (isPM) {
        topics = [
          "Product Discovery & User Research",
          "Problem Framing, Hypotheses, and JTBD",
          "PRD Writing & Specs",
          "Roadmapping & Prioritization (RICE, MoSCoW)",
          "Product Metrics & Analytics (AARRR, North Star)",
          "Experimentation & A/B Testing",
          "Stakeholder Communication & Alignment",
          "Go-To-Market & Launch Planning",
          "Competitive Analysis & Positioning",
          "Case Studies & Portfolio Artifacts"
        ];
        courses = [
          { title: "Software Product Management Specialization", provider: "Coursera", url: "https://www.coursera.org/specializations/product-management" },
          { title: "Product Strategy", provider: "Northwestern | Coursera", url: "https://www.coursera.org/learn/product-strategy" },
          { title: "A/B Testing", provider: "Udacity", url: "https://www.udacity.com/course/ab-testing--ud257" }
        ];
        certifications = ["AIPMM or Pragmatic Institute PM certifications (optional)"];
      } else if (isSEC) {
        topics = [
          "Networking & OS Fundamentals",
          "Threat Modeling and Risk Assessment",
          "Web Security & OWASP Top 10",
          "SIEM & Log Analysis",
          "Vulnerability Scanning & Pen Testing Basics",
          "Incident Response & Playbooks",
          "Cloud Security Fundamentals",
          "Secure Coding & DevSecOps",
          "Identity & Access Management",
          "Security Lab Projects & Reports"
        ];
        courses = [
          { title: "Introduction to Cyber Security", provider: "Coursera (NYU)", url: "https://www.coursera.org/learn/intro-cyber-security" },
          { title: "Practical Ethical Hacking", provider: "Udemy", url: "https://www.udemy.com/course/practical-ethical-hacking/" },
          { title: "OWASP Top 10", provider: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security" }
        ];
        certifications = ["CompTIA Security+ (entry)", "eJPT (optional)"];
      } else if (isUX) {
        topics = [
          "User Research & Interviews",
          "Information Architecture",
          "Wireframing & Prototyping",
          "Visual Design & Typography",
          "Interaction Design & Microinteractions",
          "Design Systems & Components",
          "Accessibility (WCAG)",
          "Usability Testing",
          "Figma Essentials & Collaboration",
          "Portfolio Case Studies"
        ];
        courses = [
          { title: "Google UX Design Professional Certificate", provider: "Coursera", url: "https://www.coursera.org/professional-certificates/google-ux-design" },
          { title: "UX Research", provider: "Coursera", url: "https://www.coursera.org/learn/ux-research-at-scale" },
          { title: "Design Systems", provider: "Udemy", url: "https://www.udemy.com/topic/design-systems/" }
        ];
        certifications = ["None required; strong portfolio is key"];
      } else if (isMKT) {
        topics = [
          "Positioning, ICP & Messaging",
          "SEO Fundamentals & Content Strategy",
          "Paid Ads: Google Ads, Meta Ads",
          "Email Marketing & Automation",
          "Analytics: GA4, Attribution",
          "Experimentation: A/B Testing",
          "Landing Page Optimization & CRO",
          "Social & Influencer Strategy",
          "Campaign Planning & Reporting",
          "Growth Loops & Retention"
        ];
        courses = [
          { title: "Digital Marketing Specialization", provider: "Coursera (Illinois)", url: "https://www.coursera.org/specializations/digital-marketing" },
          { title: "Google Analytics 4", provider: "Google Skillshop", url: "https://skillshop.exceedlms.com/student/path/29344-google-analytics" },
          { title: "SEO Fundamentals", provider: "Semrush Academy", url: "https://www.semrush.com/academy/" }
        ];
        certifications = ["Google Ads Certifications", "HubSpot Inbound (optional)"];
      } else {
        // Generic but still structured fallback
        topics = [
          "Role-specific fundamentals",
          "Intermediate skill-building",
          "Practical projects",
          "Tooling & workflows",
          "Metrics & evaluation",
          "Portfolio/case studies",
          "Networking & industry knowledge",
          "Interview preparation",
          "Continuous learning"
        ];
        courses = [
          { title: "Career Development Fundamentals", provider: "Coursera", url: "https://www.coursera.org/specializations/career-success" },
          { title: "Professional Skills Development", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/topics/professional-development" }
        ];
        certifications = ["Relevant industry certification (optional)"];
      }

      // Timelines per domain
      const hrs = args.hoursPerWeek;
      const weeks = args.weeks;
      const makeBullets = (items: string[]) => items.join("\n");

      const timeline = Array.from({ length: weeks }, (_, i) => {
        const week = i + 1;

        // Simple phase gating for structure
        let phase: "Found" | "Build" | "Project" | "Interview" = "Build";
        if (week <= Math.ceil(weeks * 0.25)) phase = "Found";
        else if (week <= Math.ceil(weeks * 0.65)) phase = "Build";
        else if (week <= Math.max(Math.ceil(weeks * 0.85), weeks - 2)) phase = "Project";
        else phase = "Interview";

        // Domain-specific weekly bullets (concise but concrete)
        if (isSWE) {
          const juniorLang = level === "junior" ? "TypeScript" : "your primary language";
          const bulletsByPhase: Record<string, string[]> = {
            Found: [
              `- Solve 10 NeetCode easy problems (Arrays/Strings) (${Math.max(3, Math.round(hrs * 0.45))}h): https://neetcode.io/roadmap`,
              `- Implement 2 classic problems in ${juniorLang} with tests (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Notes on patterns in a README/Gist (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Watch intro system design (1 video) and summarize (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Build: [
              `- Build a small API with auth & pagination (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Add SQL DB + 3 indexed queries (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Containerize with Docker & basic CI (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Integration tests baseline (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Project: [
              `- Scope feature(s) for portfolio app; create issues/milestones (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Implement feature + tests (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Add logging/metrics; measure 1 perf metric (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Polish README with screenshots/demo (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Interview: [
              `- 8–10 DSA problems mixed difficulty (${Math.max(3, Math.round(hrs * 0.45))}h): https://leetcode.com`,
              `- 1 system design mock + HLD doc (${Math.max(2, Math.round(hrs * 0.3))}h)`,
              `- Behavioral STAR stories (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Resume refresh highlighting impact (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ]
          };
          return { week, focus: makeBullets(bulletsByPhase[phase]) };
        }

        if (isDS) {
          const bulletsByPhase: Record<string, string[]> = {
            Found: [
              `- Complete Pandas data cleaning mini-project (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- EDA + visualization on public dataset; notebook deliverable (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Stats refresher (distributions, CI) with notes (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- SQL practice set (20 queries) (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Build: [
              `- Train baseline models (LR/Tree) + cross-validation (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Feature engineering pipeline in sklearn (${Math.max(2, Math.round(hrs * 0.25))}h)`,
              `- Model evaluation report (metrics/plots) (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Track experiments (MLflow or similar) (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Project: [
              `- Define a portfolio ML project and dataset (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Build MVP notebook + README (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Create dashboard/visualization (Streamlit) (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Draft blog-style summary (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Interview: [
              `- Kaggle mini-competition practice (${Math.max(3, Math.round(hrs * 0.45))}h): https://www.kaggle.com/competitions`,
              `- ML concepts Q&A sheet (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Portfolio polish with links & screenshots (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Behavioral story prep (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ]
          };
          return { week, focus: makeBullets(bulletsByPhase[phase]) };
        }

        if (isPM) {
          const bulletsByPhase: Record<string, string[]> = {
            Found: [
              `- Draft 1-page problem statement for a product idea (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- 3 user interviews; notes + insights doc (${Math.max(2, Math.round(hrs * 0.3))}h)`,
              `- Competitive analysis table (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Define success metrics (North Star + 2 input metrics) (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Build: [
              `- Write a PRD for one feature (${Math.max(2, Math.round(hrs * 0.3))}h)`,
              `- Create a simple roadmap & RICE scoring (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Design experiment plan (A/B) with metrics (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Stakeholder comms plan (brief) (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Project: [
              `- Ship a clickable prototype/spec and walkthrough (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Draft GTM brief + launch checklist (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Build a KPI dashboard mock (Sheets/Looker mock) (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Write a case study page (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ],
            Interview: [
              `- PM case practice x2; write structured solutions (${Math.max(3, Math.round(hrs * 0.45))}h)`,
              `- Metrics/estimation drills (${Math.max(1, Math.round(hrs * 0.2))}h)`,
              `- Portfolio/case study polish (${Math.max(1, Math.round(hrs * 0.15))}h)`,
              `- Behavioral stories (STAR) (${Math.max(1, Math.round(hrs * 0.15))}h)`
            ]
          };
          return { week, focus: makeBullets(bulletsByPhase[phase]) };
        }

        // Generic but actionable
        const generic: Record<string, string[]> = {
          Found: [
            `- Complete 2–3 foundational lessons with notes (${Math.max(2, Math.round(hrs * 0.5))}h)`,
            `- Tiny exercise applying new concepts (${Math.max(2, Math.round(hrs * 0.3))}h)`,
            `- Summarize learnings in a short post (${Math.max(1, Math.round(hrs * 0.2))}h)`,
            `- Identify role-specific resources (1h)`,
          ],
          Build: [
            `- Deep-dive into an intermediate module (${Math.max(3, Math.round(hrs * 0.5))}h)`,
            `- Implement 1–2 features in a sample project (${Math.max(2, Math.round(hrs * 0.3))}h)`,
            `- Create flashcards/notes for key concepts (${Math.max(1, Math.round(hrs * 0.2))}h)`,
            `- Seek feedback from a peer/mentor (${Math.max(1, Math.round(hrs * 0.15))}h)`,
          ],
          Project: [
            `- Define scope for a portfolio-ready project (${Math.max(1, Math.round(hrs * 0.15))}h)`,
            `- Build and document an MVP (${Math.max(3, Math.round(hrs * 0.55))}h)`,
            `- Add README with screenshots and instructions (${Math.max(1, Math.round(hrs * 0.2))}h)`,
            `- Record a short demo (${Math.max(1, Math.round(hrs * 0.15))}h)`,
          ],
          Interview: [
            `- Refresh fundamentals with quick quizzes (${Math.max(2, Math.round(hrs * 0.35))}h)`,
            `- Practice 2–3 mock interviews (${Math.max(2, Math.round(hrs * 0.35))}h)`,
            `- Polish resume/portfolio with project highlights (${Math.max(1, Math.round(hrs * 0.3))}h)`,
            `- Outreach: 2 networking touches (${Math.max(1, Math.round(hrs * 0.15))}h)`,
          ],
        };

        return { week, focus: makeBullets(generic[phase]) };
      });

      return {
        topics,
        courses,
        certifications,
        timeline,
        summary: `Personalized ${args.weeks}-week plan aligned to ${args.dreamRole || "your target role"} (~${args.hoursPerWeek}h/week). Calibrated to ${level} with concrete weekly outputs and links.`,
      };
    }
  },
});