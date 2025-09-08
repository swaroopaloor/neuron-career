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
  // Show only the currently selected template
  const currentTemplate = templates.find((t) => t.id === selectedStyle) ?? templates[0];

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
        {/* Single, focused preview for the selected style */}
        <div className="w-full">
          <div
            className={`border rounded-lg p-5 hover:shadow-md transition-shadow text-left ring-1 ring-border bg-card ${selectedStyle === currentTemplate.id ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                {currentTemplate.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{currentTemplate.name}</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {currentTemplate.description}
                </p>

                {/* Larger visual example of how the resume looks */}
                <div className={`bg-white rounded-md p-4 ${previewClasses(currentTemplate.id)}`}>
                  {/* Header bar (name) */}
                  <div className="h-3 w-48 bg-gray-900/80 rounded mb-3" />
                  {/* Contact lines */}
                  <div className="space-y-1.5 mb-3">
                    <div className="h-2 w-64 bg-gray-700/40 rounded" />
                    <div className="h-2 w-56 bg-gray-700/30 rounded" />
                  </div>
                  {/* Section title */}
                  <div className="h-2.5 w-40 bg-gray-800/70 rounded mb-2" />
                  {/* Body paragraphs */}
                  <div className="space-y-1.5 mb-3">
                    <div className="h-2 w-72 bg-gray-700/40 rounded" />
                    <div className="h-2 w-64 bg-gray-700/30 rounded" />
                    <div className="h-2 w-60 bg-gray-700/20 rounded" />
                  </div>
                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    <div className="h-5 w-16 bg-gray-300 rounded-full" />
                    <div className="h-5 w-14 bg-gray-300 rounded-full" />
                    <div className="h-5 w-20 bg-gray-300 rounded-full" />
                    <div className="h-5 w-12 bg-gray-300 rounded-full" />
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => onSelectStyle(currentTemplate.id)}
                >
                  Use "{currentTemplate.name}"
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}