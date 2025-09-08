import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Briefcase, GraduationCap, Code } from "lucide-react";

type StyleId = "classic" | "modern" | "minimal" | "technical" | "elegant" | "compact" | "creative" | "executive";

interface Template {
  id: StyleId;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface TemplateLibraryProps {
  onSelectStyle: (styleId: StyleId) => void;
  selectedStyle?: StyleId;
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
  {
    id: "elegant",
    name: "Elegant",
    description: "Refined typography with soft accents and ample whitespace",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense layout optimized for fitting more in one page",
    icon: <Code className="h-5 w-5" />,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Playful accents, asymmetric dividers, standout headings",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Subtle luxury with small caps and refined separators",
    icon: <GraduationCap className="h-5 w-5" />,
  },
];

function previewClasses(id: StyleId) {
  switch (id) {
    case "modern":
      return "border-2 border-primary/50";
    case "minimal":
      return "border border-gray-200";
    case "technical":
      return "border-2 border-gray-800";
    case "elegant":
      return "border border-rose-200";
    case "compact":
      return "border border-gray-300 shadow-sm";
    case "creative":
      return "border-2 border-purple-400";
    case "executive":
      return "border border-amber-300";
    default:
      return "border border-gray-300";
  }
}

export function TemplateLibrary({ onSelectStyle, selectedStyle }: TemplateLibraryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Resume Styles</CardTitle>
        <div className="w-full sm:w-64">
          <Select
            value={selectedStyle}
            onValueChange={(v) => onSelectStyle(v as StyleId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a style" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow text-left ${
                selectedStyle === template.id ? "ring-2 ring-primary" : ""
              }`}
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
                  <div className={`bg-white rounded-md p-2 ${previewClasses(template.id)}`}>
                    <div className="h-2 w-24 bg-gray-900/80 rounded mb-2" />
                    <div className="space-y-1">
                      <div className="h-1.5 w-40 bg-gray-700/50 rounded" />
                      <div className="h-1.5 w-36 bg-gray-700/40 rounded" />
                      <div className="h-1.5 w-28 bg-gray-700/30 rounded" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <div className="h-4 w-12 bg-gray-300 rounded-full" />
                      <div className="h-4 w-10 bg-gray-300 rounded-full" />
                      <div className="h-4 w-14 bg-gray-300 rounded-full" />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    Use Style
                  </Button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}