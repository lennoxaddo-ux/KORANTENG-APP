import React, { useState, useEffect } from "react";
import { X, Save, Paperclip, FileText, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task } from "../types";
import { cn } from "../utils";

interface TaskDetailsModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export function TaskDetailsModal({ task, isOpen, onClose, onUpdate }: TaskDetailsModalProps) {
  const [notes, setNotes] = useState(task.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(task.notes || "");
  }, [task.notes]);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(task.id, { notes });
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-stone-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900 leading-tight">{task.title}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Task Details & Notes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Description (Read-only here, edit via main form if needed or add edit here) */}
              {task.description && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Description</label>
                  <p className="text-sm text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-100 italic">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Notes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Personal Notes</label>
                  <span className="text-[10px] text-stone-300 font-medium">Auto-saves on close</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write down your thoughts, steps, or reminders..."
                  className="w-full min-h-[200px] rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700 placeholder:text-stone-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                />
              </div>

              {/* Attachments Section (Placeholder for now as requested) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Attachments</label>
                  <button className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                    <Plus className="h-3 w-3" />
                    Add File
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments && task.attachments.length > 0 ? (
                    task.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <Paperclip className="h-4 w-4 text-stone-400 shrink-0" />
                          <span className="text-xs font-medium text-stone-700 truncate">{file.name}</span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-stone-100 text-stone-300">
                      <Paperclip className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs font-medium">No attachments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-stone-100 bg-stone-50/50 p-6">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-stone-500 hover:text-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
