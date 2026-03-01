import React, { useState, useEffect } from "react";
import { X, Save, Calendar, Trash2, CheckCircle2, Circle, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Task } from "../types";
import { format } from "date-fns";
import { cn } from "../utils";

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggleComplete,
}: TaskDetailModalProps) {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
      setDescription(task.description || "");
      setTitle(task.title || "");
    }
  }, [task]);

  const handleSave = () => {
    if (task) {
      onUpdate(task.id, { description, title });
      setIsEditing(false);
    }
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggleComplete(task.id)}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 text-stone-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Circle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  )}
                </button>
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
                    Task Details
                  </h2>
                  <p className="text-xs font-bold text-stone-300">Created {format(new Date(task.created_at), "MMM d, yyyy")}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-stone-100 p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-600 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Title Section */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                  Goal
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsEditing(true);
                  }}
                  className={cn(
                    "w-full bg-transparent border-none p-0 focus:ring-0 text-2xl font-black text-stone-900 placeholder:text-stone-200",
                    task.completed && "line-through text-stone-400"
                  )}
                  placeholder="Task title..."
                />
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4">
                {task.deadline && (
                  <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-2 border border-stone-100">
                    <Calendar className="h-4 w-4 text-stone-400" />
                    <span className="text-xs font-bold text-stone-600">
                      Due {format(new Date(task.deadline), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 border border-indigo-100">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    {task.quadrant === 0 ? "Backlog" : 
                     task.quadrant === 1 ? "Urgent & Important" :
                     task.quadrant === 2 ? "Schedule" :
                     task.quadrant === 3 ? "Delegate" : "Eliminate"}
                  </span>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                    <AlignLeft className="h-3 w-3" />
                    Extra Notes & Context
                  </label>
                </div>
                <div className="relative group">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setIsEditing(true);
                    }}
                    placeholder="Add detailed notes about this task..."
                    rows={8}
                    className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50/50 p-6 text-base font-medium text-stone-700 placeholder:text-stone-300 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all resize-none"
                  />
                  {!description && !isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <p className="text-sm font-bold uppercase tracking-widest italic">Write something meaningful...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/50 p-6 sm:p-8">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isEditing}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95",
                    isEditing 
                      ? "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700" 
                      : "bg-stone-300 shadow-none cursor-not-allowed"
                  )}
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
