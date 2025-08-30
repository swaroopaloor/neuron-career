import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const seedTestResumes = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const sampleResumes = [
      {
        title: "Software Engineer Resume",
        content: JSON.stringify({
          personalInfo: {
            name: "John Doe",
            email: "john.doe@example.com",
            phone: "+1 (555) 123-4567",
            location: "San Francisco, CA"
          },
          summary: "Experienced full-stack software engineer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies.",
          experience: [
            {
              title: "Senior Software Engineer",
              company: "Tech Corp",
              duration: "Jan 2022 - Present",
              description: "• Led development of microservices architecture serving 1M+ users\n• Reduced application load times by 40% through performance optimization\n• Mentored 3 junior developers and established code review processes"
            },
            {
              title: "Software Engineer",
              company: "StartupXYZ",
              duration: "Jun 2020 - Dec 2021",
              description: "• Built responsive web applications using React and TypeScript\n• Implemented RESTful APIs and database schemas\n• Collaborated with design team to improve user experience"
            }
          ],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              school: "University of California, Berkeley",
              year: "2020"
            }
          ],
          skills: ["JavaScript", "React", "Node.js", "TypeScript", "Python", "AWS", "Docker", "PostgreSQL"]
        })
      },
      {
        title: "Marketing Manager Resume",
        content: JSON.stringify({
          personalInfo: {
            name: "Jane Smith",
            email: "jane.smith@example.com",
            phone: "+1 (555) 987-6543",
            location: "New York, NY"
          },
          summary: "Results-driven marketing manager with 7+ years of experience in digital marketing, brand management, and campaign optimization.",
          experience: [
            {
              title: "Marketing Manager",
              company: "Growth Inc",
              duration: "Mar 2021 - Present",
              description: "• Increased brand awareness by 150% through integrated marketing campaigns\n• Managed $500K annual marketing budget across multiple channels\n• Led cross-functional team of 8 marketing professionals"
            }
          ],
          education: [
            {
              degree: "Master of Business Administration",
              school: "NYU Stern School of Business",
              year: "2019"
            }
          ],
          skills: ["Digital Marketing", "Brand Management", "Google Analytics", "SEO/SEM", "Content Strategy", "Team Leadership"]
        })
      }
    ];

    const createdResumes = [];
    for (const resume of sampleResumes) {
      const resumeId = await ctx.db.insert("resumes", {
        userId,
        title: resume.title,
        content: resume.content,
        lastModified: Date.now(),
      });
      createdResumes.push(resumeId);
    }

    return {
      message: `Created ${createdResumes.length} test resumes`,
      resumeIds: createdResumes,
    };
  },
});
