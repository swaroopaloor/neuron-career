import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, GraduationCap, Code } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  content: any;
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
}

const templates: Template[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and professional layout suitable for most industries",
    icon: <Briefcase className="h-5 w-5" />,
    content: {
      personalInfo: { name: "", email: "", phone: "", location: "" },
      summary: "Experienced professional with a proven track record of success in [industry]. Skilled in [key skills] with [X] years of experience delivering results.",
      experience: [
        {
          title: "Senior [Job Title]",
          company: "[Company Name]",
          duration: "[Start Date] - [End Date]",
          description: "• Led [specific project/initiative] resulting in [quantifiable outcome]\n• Managed [team size/budget] and improved [metric] by [percentage]\n• Collaborated with [departments/stakeholders] to [achievement]"
        }
      ],
      education: [
        {
          degree: "Bachelor of [Field]",
          school: "[University Name]",
          year: "[Graduation Year]"
        }
      ],
      skills: ["Leadership", "Project Management", "Strategic Planning", "Team Building"]
    }
  },
  {
    id: "technical",
    name: "Technical",
    description: "Optimized for software engineers and technical roles",
    icon: <Code className="h-5 w-5" />,
    content: {
      personalInfo: { name: "", email: "", phone: "", location: "" },
      summary: "Full-stack software engineer with [X] years of experience building scalable web applications. Proficient in [programming languages] and passionate about [technical area].",
      experience: [
        {
          title: "Software Engineer",
          company: "[Company Name]",
          duration: "[Start Date] - [End Date]",
          description: "• Developed and maintained [type of applications] using [technologies]\n• Optimized application performance, reducing load times by [percentage]\n• Implemented [feature/system] serving [number] of users daily\n• Collaborated in agile development environment with [team composition]"
        }
      ],
      education: [
        {
          degree: "Bachelor of Science in Computer Science",
          school: "[University Name]",
          year: "[Graduation Year]"
        }
      ],
      skills: ["JavaScript", "React", "Node.js", "Python", "SQL", "Git", "AWS", "Docker"]
    }
  },
  {
    id: "entry-level",
    name: "Entry Level",
    description: "Perfect for recent graduates and career changers",
    icon: <GraduationCap className="h-5 w-5" />,
    content: {
      personalInfo: { name: "", email: "", phone: "", location: "" },
      summary: "Recent [degree] graduate with strong foundation in [field]. Eager to apply academic knowledge and internship experience to contribute to [industry/role type].",
      experience: [
        {
          title: "Intern",
          company: "[Company Name]",
          duration: "[Start Date] - [End Date]",
          description: "• Assisted with [projects/tasks] under supervision of [role]\n• Gained hands-on experience in [skills/tools]\n• Contributed to [specific project] that [outcome]\n• Developed [skill] through [specific activities]"
        }
      ],
      education: [
        {
          degree: "Bachelor of [Field]",
          school: "[University Name]",
          year: "[Graduation Year]"
        }
      ],
      skills: ["Communication", "Problem Solving", "Time Management", "Teamwork"]
    }
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple design focusing on content",
    icon: <FileText className="h-5 w-5" />,
    content: {
      personalInfo: { name: "", email: "", phone: "", location: "" },
      summary: "",
      experience: [],
      education: [],
      skills: []
    }
  }
];

export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    Use Template
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
