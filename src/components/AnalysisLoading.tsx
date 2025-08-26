import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, FileText, Target, Zap } from "lucide-react";

const loadingSteps = [
  "Parsing your resume PDF...",
  "Analyzing job description keywords...",
  "Comparing resume against job description...",
  "Calculating match & ATS scores...",
  "Generating tailored recommendations...",
  "Compiling your final report...",
];

export default function AnalysisLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <motion.div 
        className="relative w-48 h-48 flex items-center justify-center mb-8"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <BrainCircuit className="w-24 h-24 text-primary" />
        <motion.div
          className="absolute"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <FileText className="w-8 h-8 text-muted-foreground absolute -top-8 left-16" />
        </motion.div>
        <motion.div
          className="absolute"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Target className="w-8 h-8 text-muted-foreground absolute top-16 -right-8" />
        </motion.div>
        <motion.div
          className="absolute"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Zap className="w-8 h-8 text-muted-foreground absolute bottom-0 -left-4" />
        </motion.div>
      </motion.div>

      <h2 className="text-2xl font-bold text-foreground mb-4">
        AI Analysis in Progress...
      </h2>
      
      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={Math.floor(Date.now() / 3000) % loadingSteps.length}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-muted-foreground"
          >
            {loadingSteps[Math.floor(Date.now() / 3000) % loadingSteps.length]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm mt-8">
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 18, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}