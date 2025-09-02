import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Briefcase, GraduationCap, Code } from "lucide-react";

type StyleId = "classic" | "modern" | "minimal" | "technical";

interface Template {
  id: StyleId;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface TemplateLibraryProps {
  onSelectStyle: (styleId: StyleId) => void;
}

const templates: Template[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional resume with clear sections and solid separators",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold headings, accent color lines, tighter spacing",
    icon: <Code className="h-5 w-5" />,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean layout with subtle dividers and light accents",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "technical",
    name: "Technical",
    description: "Monospace headings, grid alignment, tag-style skills",
    icon: <GraduationCap className="h-5 w-5" />,
  },
];

export function TemplateLibrary({ onSelectStyle }: TemplateLibraryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Styles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectStyle(template.id)}
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
                    Use Style
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