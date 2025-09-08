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

function previewTokens(id: StyleId) {
  // Defaults: Classic
  let container = "bg-white rounded-lg p-4";
  let nameBar = "h-3 w-48 bg-gray-900/80 rounded mb-3";
  let infoStrong = "bg-gray-700/40";
  let infoLight = "bg-gray-700/30";
  let sectionTitle = "h-2.5 w-40 bg-gray-800/70 rounded mb-2";
  let para1 = "h-2 w-72 bg-gray-700/40 rounded";
  let para2 = "h-2 w-64 bg-gray-700/30 rounded";
  let para3 = "h-2 w-60 bg-gray-700/20 rounded";
  let tag = "h-5 rounded-full bg-gray-300";
  let tagWidths = ["w-16", "w-14", "w-20", "w-12"];
  let headerRule = ""; // optional accent/underline bar

  switch (id) {
    case "modern":
      container = "bg-white rounded-xl p-5 border border-gray-200 shadow-sm";
      nameBar = "h-3.5 w-56 rounded-sm bg-gradient-to-r from-primary/80 to-primary/60 mb-3";
      infoStrong = "bg-primary/30";
      infoLight = "bg-primary/20";
      sectionTitle = "h-2.5 w-44 bg-primary/60 rounded-sm mb-2";
      para1 = "h-2 w-72 bg-gray-700/40 rounded-sm";
      para2 = "h-2 w-64 bg-gray-700/30 rounded-sm";
      para3 = "h-2 w-60 bg-gray-700/20 rounded-sm";
      tag = "h-5 rounded-full border border-primary/30 bg-primary/10";
      tagWidths = ["w-16", "w-24", "w-14", "w-20"];
      headerRule = "h-1 w-full bg-primary/50 rounded mb-3";
      break;
    case "minimal":
      container = "bg-white rounded-md p-5";
      nameBar = "h-3 w-48 bg-gray-900/70 rounded mb-2";
      infoStrong = "bg-gray-300/70";
      infoLight = "bg-gray-300/50";
      sectionTitle = "h-2 w-40 bg-gray-300 rounded mb-2";
      para1 = "h-1.5 w-72 bg-gray-300/70 rounded";
      para2 = "h-1.5 w-64 bg-gray-300/60 rounded";
      para3 = "h-1.5 w-60 bg-gray-300/50 rounded";
      tag = "h-5 rounded-md bg-gray-200";
      tagWidths = ["w-16", "w-20", "w-14", "w-24"];
      headerRule = "h-px w-full bg-gray-200 mb-3";
      break;
    case "technical":
      container = "bg-white rounded-md p-5 border-2 border-gray-900";
      nameBar = "h-3 w-64 bg-gray-900 rounded-none mb-2";
      infoStrong = "bg-gray-800";
      infoLight = "bg-gray-700";
      sectionTitle = "h-2.5 w-48 bg-gray-900 rounded-none mb-2";
      para1 = "h-2 w-72 bg-gray-800 rounded-none";
      para2 = "h-2 w-64 bg-gray-700 rounded-none";
      para3 = "h-2 w-60 bg-gray-600 rounded-none";
      tag = "h-5 rounded-none bg-black";
      tagWidths = ["w-24", "w-20", "w-28", "w-16"];
      headerRule = "h-1 w-full bg-gray-900 mb-2";
      break;
    case "elegant":
      container = "bg-white rounded-2xl p-6 border border-rose-200";
      nameBar = "h-3.5 w-56 bg-rose-900/90 rounded mb-2";
      infoStrong = "bg-rose-400/40";
      infoLight = "bg-rose-300/30";
      sectionTitle = "h-2.5 w-40 bg-rose-700/70 rounded mb-2";
      para1 = "h-2 w-72 bg-rose-300/50 rounded";
      para2 = "h-2 w-64 bg-rose-300/40 rounded";
      para3 = "h-2 w-60 bg-rose-300/30 rounded";
      tag = "h-5 rounded-full bg-rose-50 border border-rose-200";
      tagWidths = ["w-20", "w-16", "w-24", "w-14"];
      headerRule = "h-0.5 w-full bg-rose-300 mb-3";
      break;
    case "compact":
      container = "bg-white rounded-md p-4 border border-gray-300";
      nameBar = "h-3 w-44 bg-gray-900/80 rounded mb-1.5";
      infoStrong = "bg-gray-700/50";
      infoLight = "bg-gray-700/40";
      sectionTitle = "h-2 w-36 bg-gray-800/70 rounded mb-1.5";
      para1 = "h-1.5 w-64 bg-gray-700/50 rounded";
      para2 = "h-1.5 w-56 bg-gray-700/40 rounded";
      para3 = "h-1.5 w-52 bg-gray-700/30 rounded";
      tag = "h-4 rounded bg-gray-300";
      tagWidths = ["w-14", "w-16", "w-12", "w-20"];
      headerRule = "h-px w-full bg-gray-300 mb-2";
      break;
    case "creative":
      container = "bg-white rounded-xl p-5 border-2 border-purple-400";
      nameBar = "h-3.5 w-60 bg-gradient-to-r from-purple-700 via-pink-600 to-orange-500 rounded-xl mb-2";
      infoStrong = "bg-purple-400/50";
      infoLight = "bg-purple-300/40";
      sectionTitle = "h-2.5 w-48 bg-purple-600/70 rounded-xl mb-2";
      para1 = "h-2 w-72 bg-purple-300/50 rounded";
      para2 = "h-2 w-64 bg-purple-300/40 rounded";
      para3 = "h-2 w-60 bg-purple-300/30 rounded";
      tag = "h-5 rounded-full bg-purple-100 border border-purple-300";
      tagWidths = ["w-24", "w-14", "w-20", "w-28"];
      headerRule = "h-1 w-full bg-gradient-to-r from-purple-400 to-pink-400 rounded mb-3";
      break;
    case "executive":
      container = "bg-white rounded-xl p-6 border border-amber-300";
      nameBar = "h-3.5 w-56 bg-amber-900/90 rounded mb-2";
      infoStrong = "bg-amber-700/40";
      infoLight = "bg-amber-600/30";
      sectionTitle = "h-2.5 w-44 bg-amber-800/70 rounded mb-2";
      para1 = "h-2 w-72 bg-amber-600/40 rounded";
      para2 = "h-2 w-64 bg-amber-600/30 rounded";
      para3 = "h-2 w-60 bg-amber-600/20 rounded";
      tag = "h-5 rounded-full bg-amber-50 border border-amber-300";
      tagWidths = ["w-20", "w-24", "w-16", "w-14"];
      headerRule = "h-[3px] w-full bg-amber-400 rounded mb-3";
      break;
  }
  return { container, nameBar, infoStrong, infoLight, sectionTitle, para1, para2, para3, tag, tagWidths, headerRule };
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

                {/* Larger visual example with per-style differences */}
                {(() => {
                  const tk = previewTokens(currentTemplate.id);
                  return (
                    <div className={`${tk.container} ${previewClasses(currentTemplate.id)}`}>
                      {/* Optional accent rule for certain styles */}
                      {tk.headerRule && <div className={tk.headerRule} />}
                      {/* Header bar (name) */}
                      <div className={tk.nameBar} />
                      {/* Contact lines */}
                      <div className="space-y-1.5 mb-3">
                        <div className={`h-2 w-64 ${tk.infoStrong} rounded`} />
                        <div className={`h-2 w-56 ${tk.infoLight} rounded`} />
                      </div>
                      {/* Section title */}
                      <div className={tk.sectionTitle} />
                      {/* Body paragraphs */}
                      <div className="space-y-1.5 mb-3">
                        <div className={tk.para1} />
                        <div className={tk.para2} />
                        <div className={tk.para3} />
                      </div>
                      {/* Skills tags */}
                      <div className="flex flex-wrap gap-1.5">
                        <div className={`${tk.tag} ${tk.tagWidths[0]}`} />
                        <div className={`${tk.tag} ${tk.tagWidths[1]}`} />
                        <div className={`${tk.tag} ${tk.tagWidths[2]}`} />
                        <div className={`${tk.tag} ${tk.tagWidths[3]}`} />
                      </div>
                    </div>
                  );
                })()}

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