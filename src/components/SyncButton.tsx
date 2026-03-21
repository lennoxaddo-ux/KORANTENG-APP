import React from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "../utils";
import { motion, AnimatePresence } from "motion/react";

interface SyncButtonProps {
  isSyncing: boolean;
  hasUnsavedChanges: boolean;
  onSync: () => void;
  lastSynced: Date | null;
}

export function SyncButton({ isSyncing, hasUnsavedChanges, onSync, lastSynced }: SyncButtonProps) {
  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className={cn(
        "group relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95",
        hasUnsavedChanges 
          ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100" 
          : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
      )}
    >
      <AnimatePresence mode="wait">
        {isSyncing ? (
          <motion.div
            key="syncing"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <RefreshCw className="h-4 w-4" />
          </motion.div>
        ) : hasUnsavedChanges ? (
          <motion.div
            key="unsaved"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <CloudOff className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="saved"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-start leading-none">
        <span className="uppercase tracking-wider">
          {isSyncing ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "All Saved"}
        </span>
        {lastSynced && !hasUnsavedChanges && (
          <span className="text-[9px] opacity-60 mt-0.5">
            Last synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {hasUnsavedChanges && !isSyncing && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
      )}
    </button>
  );
}
