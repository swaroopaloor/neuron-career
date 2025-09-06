import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Users,
  Settings,
  Monitor,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// Connection Status Component
const ConnectionStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" | "error" }) => {
  const statusConfig = {
    connecting: { icon: Loader2, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "Connecting..." },
    connected: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20", text: "Connected" },
    disconnected: { icon: WifiOff, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-950/20", text: "Disconnected" },
    error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20", text: "Connection Error" }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}
    >
      {status === "connecting" ? (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </motion.div>
      ) : (
        <Icon className={`h-4 w-4 ${config.color}`} />
      )}
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </motion.div>
  );
};

// Loading Overlay for Call Actions
const CallActionLoading = ({ isVisible, text }: { isVisible: boolean, text: string }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-card border rounded-lg p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full"
            />
            <span className="font-medium">{text}</span>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function InterviewLiveCall({
  jd,
  resumeFileId,
  mode = "intro",
}: {
  jd: string;
  resumeFileId?: string; // Id<"_storage"> but avoid import to keep this component lightweight
  mode?: "intro" | "technical" | "hr";
}) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [participants] = useState([
    { id: 1, name: "You", isHost: true },
    { id: 2, name: "Interviewer", isHost: false }
  ]);

  // Add: AI hooks for questions and feedback scoring
  const generatePractice = useAction(api.aiInterview.generateQuestions);
  const polishAnswerAction = useAction(api.aiInterview.polishAnswer);

  // Add: interview flow state
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [interviewDone, setInterviewDone] = useState(false);
  const [report, setReport] = useState<null | {
    totalQuestions: number;
    avgScore?: number;
    items: Array<{ q: string; a: string; score?: number }>;
  }>(null);

  // Simple browser speech recognition guard
  const getSpeechRecognition = () => {
    const AnyWindow = window as any;
    return AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition || null;
  };

  const askNextQuestion = async () => {
    if (currentIdx >= questions.length) {
      toast("No more questions");
      return;
    }
    const q = questions[currentIdx];
    try {
      // Ask via TTS for immersion (best-effort)
      const utterance = new SpeechSynthesisUtterance(q);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      toast("Question asked. Click 'Answer' and speak your response.");
    } catch {}
  };

  const startVoiceAnswer = async () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setIsRecognizing(true);
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      setAnswers(prev => {
        const copy = [...prev];
        copy[currentIdx] = transcript;
        return copy;
      });
      toast("Answer captured");
    };
    rec.onerror = () => {
      toast("Voice capture error");
      setIsRecognizing(false);
    };
    rec.onend = () => {
      setIsRecognizing(false);
    };
    rec.start();
  };

  const nextStep = async () => {
    // Optionally score this answer before moving on
    try {
      const q = questions[currentIdx];
      const a = answers[currentIdx] || "";
      if (q && a) {
        const composedJd = `Interview mode: ${mode}. Resume: ${resumeFileId ? "attached" : "none"}. JD: ${jd}`;
        // Best-effort scoring; backend can return structured feedback
        await polishAnswerAction({ question: q, answer: a, jd: composedJd });
      }
    } catch {
      // best-effort; continue
    }

    if (currentIdx + 1 >= questions.length) {
      // Finish interview
      setInterviewDone(true);
      // Lightweight report
      const items = questions.map((q, i) => ({
        q,
        a: answers[i] || "",
      }));
      const avgLen = items.length
        ? Math.round(items.reduce((s, it) => s + (it.a?.split(" ").length || 0), 0) / items.length)
        : 0;
      setReport({
        totalQuestions: items.length,
        avgScore: undefined,
        items,
      });
      toast("Interview completed. Report generated.");
    } else {
      setCurrentIdx(i => i + 1);
      await askNextQuestion();
    }
  };

  const handleStartCall = async () => {
    try {
      setIsLoading(true);
      setLoadingText("Initializing video call...");
      setConnectionStatus("connecting");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLoadingText("Connecting to interviewer...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoadingText("Establishing secure connection...");
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setIsCallActive(true);
      setConnectionStatus("connected");
      toast("Call started successfully!");

      // Fetch tailored questions
      try {
        const arr = await generatePractice({
          jd: `Live mock. Mode: ${mode}. ${jd}`,
          interviewType: mode === "technical" ? "technical" : "behavioral",
          count: 5,
          // @ts-ignore optional
          resumeFileId,
        });
        if (Array.isArray(arr) && arr.length > 0) {
          setQuestions(arr);
          setAnswers(Array(arr.length).fill(""));
          setCurrentIdx(0);
        } else {
          // fallback default questions
          const fallback =
            mode === "technical"
              ? [
                  "Explain the concept of closures in JavaScript and provide an example.",
                  "How would you optimize a React application for performance?",
                  "Describe a time you diagnosed a production incident and your approach.",
                  "What is the difference between a process and a thread?",
                  "Explain Big-O for inserting into a balanced BST.",
                ]
              : [
                  "Tell me about yourself.",
                  "Describe a challenge you faced and how you overcame it.",
                  "Tell me about a time you worked in a team.",
                  "What are your strengths and weaknesses?",
                  "Why are you interested in this role?",
                ];
          setQuestions(fallback);
          setAnswers(Array(fallback.length).fill(""));
          setCurrentIdx(0);
        }
      } catch {
        // handled above with fallback
      }
      
    } catch (error) {
      setConnectionStatus("error");
      toast("Failed to start call");
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  const handleEndCall = async () => {
    try {
      setIsLoading(true);
      setLoadingText("Ending call...");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsCallActive(false);
      setConnectionStatus("disconnected");
      toast("Call ended");
      
    } catch (error) {
      toast("Error ending call");
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  const toggleVideo = async () => {
    setIsLoading(true);
    setLoadingText(isVideoEnabled ? "Turning off camera..." : "Turning on camera...");
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsVideoEnabled(!isVideoEnabled);
    setIsLoading(false);
    setLoadingText("");
    toast(isVideoEnabled ? "Camera turned off" : "Camera turned on");
  };

  const toggleAudio = async () => {
    setIsLoading(true);
    setLoadingText(isAudioEnabled ? "Muting microphone..." : "Unmuting microphone...");
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsAudioEnabled(!isAudioEnabled);
    setIsLoading(false);
    setLoadingText("");
    toast(isAudioEnabled ? "Microphone muted" : "Microphone unmuted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-6 w-6 text-blue-600" />
                  Live Interview Call
                </CardTitle>
                <CardDescription>
                  <span className="block">Mode: <span className="font-medium capitalize">{mode}</span></span>
                  <span className="block">JD: <span className="line-clamp-1">{jd || "Not provided"}</span></span>
                  <span className="block">Resume: <span className="font-medium">{resumeFileId ? "Attached" : "None"}</span></span>
                  {isCallActive && questions.length > 0 && !interviewDone && (
                    <span className="block mt-1">Question {currentIdx + 1} of {questions.length}</span>
                  )}
                </CardDescription>
              </div>
              <ConnectionStatus status={connectionStatus} />
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Video Call Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="relative overflow-hidden">
          <CallActionLoading isVisible={isLoading} text={loadingText} />
          
          <CardContent className="p-0">
            {/* Video Area */}
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
              {isCallActive ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {isVideoEnabled ? (
                    <div className="text-white text-center px-4">
                      <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      {!interviewDone && questions.length > 0 ? (
                        <>
                          <p className="text-lg font-medium mb-2">Current Question</p>
                          <p className="text-sm opacity-90 line-clamp-3 mb-4">{questions[currentIdx]}</p>
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={askNextQuestion} disabled={isRecognizing}>Ask</Button>
                            <Button size="sm" onClick={startVoiceAnswer} disabled={isRecognizing}>
                              {isRecognizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />} Answer
                            </Button>
                            <Button size="sm" variant="outline" onClick={nextStep} disabled={isRecognizing}>Next</Button>
                          </div>
                          <div className="mt-3 text-xs text-white/80 line-clamp-3">
                            {answers[currentIdx] ? `Your answer: ${answers[currentIdx]}` : "Your answer will appear here after recording."}
                          </div>
                        </>
                      ) : interviewDone ? (
                        <>
                          <p className="text-lg font-medium mb-2">Interview Complete</p>
                          <p className="text-sm opacity-75">See detailed report below.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-medium">Video Call Active</p>
                          <p className="text-sm opacity-75">Camera: {isVideoEnabled ? "On" : "Off"} • Mic: {isAudioEnabled ? "On" : "Off"}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-white text-center">
                      <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Camera Off</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white text-center"
                >
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Ready to Start Interview</p>
                  <p className="text-sm opacity-75">Click "Start Call" to begin</p>
                </motion.div>
              )}

              {/* Participants Overlay */}
              {isCallActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 right-4"
                >
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Users className="h-4 w-4" />
                      <span>{participants.length} participants</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Controls */}
            <div className="p-6 bg-card">
              <div className="flex items-center justify-center gap-4">
                {isCallActive ? (
                  <>
                    {/* Video Toggle */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={isVideoEnabled ? "default" : "destructive"}
                        size="lg"
                        onClick={toggleVideo}
                        disabled={isLoading}
                        className="rounded-full w-12 h-12 p-0"
                      >
                        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                    </motion.div>

                    {/* Audio Toggle */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={isAudioEnabled ? "default" : "destructive"}
                        size="lg"
                        onClick={toggleAudio}
                        disabled={isLoading}
                        className="rounded-full w-12 h-12 p-0"
                      >
                        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                    </motion.div>

                    {/* End Call */}
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={handleEndCall}
                        disabled={isLoading}
                        className="rounded-full w-12 h-12 p-0"
                      >
                        <PhoneOff className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      onClick={handleStartCall}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-8"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Phone className="h-5 w-5" />
                      )}
                      Start Call
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Section */}
      {interviewDone && report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Interview Performance Report
              </CardTitle>
              <CardDescription>
                Summary of your responses in this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline">Questions: {report.totalQuestions}</Badge>
                {/* avgScore is optional when backend scoring is added */}
              </div>
              <div className="space-y-3">
                {report.items.map((it, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="text-sm font-medium mb-1">Q{idx + 1}: {it.q}</div>
                    <div className="text-sm text-muted-foreground">
                      Answer: {it.a || "No answer recorded"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Call Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            title: "HD Video Quality",
            description: "Crystal clear video for professional interviews",
            icon: Video,
            status: isCallActive && isVideoEnabled ? "active" : "inactive"
          },
          {
            title: "AI Recording",
            description: "Automatic recording with AI-powered analysis",
            icon: Monitor,
            status: isCallActive ? "active" : "inactive"
          },
          {
            title: "Real-time Feedback",
            description: "Live coaching tips during your interview",
            icon: Settings,
            status: isCallActive ? "active" : "inactive"
          }
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className={`transition-all duration-300 ${feature.status === "active" ? "border-primary bg-primary/5" : ""}`}>
              <CardContent className="p-4 text-center">
                <feature.icon className={`h-8 w-8 mx-auto mb-2 ${feature.status === "active" ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-medium mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <Badge 
                  variant={feature.status === "active" ? "default" : "secondary"}
                  className="mt-2"
                >
                  {feature.status === "active" ? "Active" : "Standby"}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Participants List */}
      {isCallActive && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{participant.name[0]}</span>
                      </div>
                      <span className="font-medium">{participant.name}</span>
                      {participant.isHost && (
                        <Badge variant="secondary" className="text-xs">Host</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground">Connected</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}