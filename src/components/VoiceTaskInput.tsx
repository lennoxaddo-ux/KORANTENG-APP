import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { QuadrantType } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";

interface VoiceTaskInputProps {
  onAdd: (task: { title: string; description: string; deadline: string | null; quadrant: QuadrantType }) => void;
}

export function VoiceTaskInput({ onAdd }: VoiceTaskInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const processTranscript = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    let quadrant = QuadrantType.BACKLOG;
    let title = text;

    // Keywords for quadrants
    const keywords = [
      { key: ["urgent", "important", "do it", "do now", "asap", "priority one"], type: QuadrantType.DO },
      { key: ["schedule", "later", "plan", "next week", "tomorrow", "priority two"], type: QuadrantType.SCHEDULE },
      { key: ["delegate", "someone else", "assign", "who can", "priority three"], type: QuadrantType.DELEGATE },
      { key: ["eliminate", "ignore", "delete", "trash", "not important", "priority four"], type: QuadrantType.ELIMINATE },
    ];

    for (const group of keywords) {
      if (group.key.some(k => lowerText.includes(k))) {
        quadrant = group.type;
        // Try to remove the keyword from the title
        group.key.forEach(k => {
          title = title.replace(new RegExp(k, 'gi'), '').trim();
        });
        break;
      }
    }

    // Clean up title (remove "in", "to", "the" if they are at the end)
    title = title.replace(/\s(in|to|the|at)$/i, '').trim();

    if (title) {
      onAdd({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: `Created via voice: "${text}"`,
        deadline: null,
        quadrant,
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("error");
      setErrorMessage("Could not understand the task title.");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [onAdd]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setStatus("error");
      setErrorMessage("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("listening");
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setStatus("processing");
      processTranscript(text);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setStatus("error");
      setErrorMessage(event.error === 'not-allowed' ? "Microphone access denied." : "Error occurred while listening.");
      setTimeout(() => setStatus("idle"), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={startListening}
        disabled={status === "processing" || status === "listening"}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90",
          status === "listening" 
            ? "bg-red-100 text-red-600 animate-pulse" 
            : status === "success"
            ? "bg-emerald-100 text-emerald-600"
            : status === "error"
            ? "bg-amber-100 text-amber-600"
            : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700"
        )}
        title="Add task by voice"
      >
        <AnimatePresence mode="wait">
          {status === "listening" ? (
            <motion.div
              key="listening"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <Mic className="h-5 w-5" />
            </motion.div>
          ) : status === "processing" ? (
            <motion.div
              key="processing"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="h-5 w-5" />
            </motion.div>
          ) : status === "success" ? (
            <motion.div
              key="success"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <CheckCircle2 className="h-5 w-5" />
            </motion.div>
          ) : status === "error" ? (
            <motion.div
              key="error"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <AlertCircle className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <Mic className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {status === "listening" && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {(status === "listening" || status === "processing" || status === "error") && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="absolute left-12 z-50 whitespace-nowrap rounded-lg bg-white px-3 py-2 shadow-xl border border-stone-100 text-xs font-bold"
          >
            {status === "listening" && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-stone-600">
                  <div className="flex gap-1">
                    <span className="h-1 w-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1 w-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1 w-1 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  Listening...
                </div>
                <div className="text-[10px] text-stone-400 font-medium">
                  Say task + priority (e.g. "Buy milk urgent")
                </div>
              </div>
            )}
            {status === "processing" && (
              <div className="text-orange-600">Processing: "{transcript}"</div>
            )}
            {status === "error" && (
              <div className="text-amber-600">{errorMessage}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
