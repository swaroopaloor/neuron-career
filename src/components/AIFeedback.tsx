import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Target, FileText, BarChart3, Loader2 } from "lucide-react";

interface AISuggestions {
  atsOptimization: string[];
  keywordSuggestions: string[];
  contentImprovements: string[];
  structureRecommendations: string[];
  overallScore: number;
}

interface AIFeedbackProps {
  suggestions: AISuggestions | null;
  isLoading: boolean;
  onGenerateSuggestions: () => void;
}

export function AIFeedback({ suggestions, isLoading, onGenerateSuggestions }: AIFeedbackProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI Feedback & Suggestions
          </CardTitle>
          <Button 
            onClick={onGenerateSuggestions} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              "Generate Suggestions"
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {!suggestions && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Generate Suggestions" to get AI-powered feedback on your resume</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing your resume...</p>
            </div>
          )}

          {suggestions && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-semibold">Overall Resume Score</span>
                </div>
                <Badge 
                  variant={getScoreBadgeVariant(suggestions.overallScore)}
                  className="text-lg px-4 py-2"
                >
                  {suggestions.overallScore}/100
                </Badge>
              </div>

              {/* ATS Optimization */}
              {suggestions.atsOptimization.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    ATS Optimization
                  </h4>
                  <ul className="space-y-2">
                    {suggestions.atsOptimization.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Keyword Suggestions */}
              {suggestions.keywordSuggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recommended Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.keywordSuggestions.map((keyword, index) => (
                      <Badge key={index} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Improvements */}
              {suggestions.contentImprovements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Content Improvements
                  </h4>
                  <ul className="space-y-2">
                    {suggestions.contentImprovements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Structure Recommendations */}
              {suggestions.structureRecommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Structure Recommendations</h4>
                  <ul className="space-y-2">
                    {suggestions.structureRecommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
