import React, { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QuadrantType } from "../types";
import { cn } from "../utils";

interface TaskFormProps {
  onAdd: (task: { title: string; description: string; deadline: string | null; quadrant: QuadrantType }) => void;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [quadrant, setQuadrant] = useState<QuadrantType>(QuadrantType.BACKLOG);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title,
      description,
      deadline: deadline || null,
      quadrant,
    });
    setTitle("");
    setDescription("");
    setDeadline("");
    setQuadrant(QuadrantType.BACKLOG);
    setIsOpen(false);
  };

  const quadrantOptions = [
    { value: QuadrantType.BACKLOG, label: "Master List (Backlog)" },
    { value: QuadrantType.DO, label: "Urgent & Important (Do)" },
    { value: QuadrantType.SCHEDULE, label: "Not Urgent & Important (Schedule)" },
    { value: QuadrantType.DELEGATE, label: "Urgent & Not Important (Delegate)" },
    { value: QuadrantType.ELIMINATE, label: "Not Urgent & Not Important (Eliminate)" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 bg-orange-500 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95 whitespace-nowrap"
      >
        <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md sm:rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
        </div>
        New Task
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-20%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.5, x: "-50%", y: "-20%" }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="new-task-box fixed z-[101] w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] p-10 overflow-hidden border border-stone-100"
              style={{
                top: "45%",
                left: "50%",
              }}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">New Task</h2>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">Populate your matrix</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 hover:text-stone-700 transition-all active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50/40 divide-y divide-stone-200 shadow-inner">
                  {/* Title Field */}
                  <div className="p-8">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-3">
                      What's the goal?
                    </label>
                    <input
                      autoFocus
                      required
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter task title..."
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-2xl font-bold text-stone-900 placeholder:text-stone-200"
                    />
                  </div>

                  {/* Category and Deadline Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
                    <div className="p-8">
                      <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-3">
                        Priority Category
                      </label>
                      <div className="relative">
                        <select
                          value={quadrant}
                          onChange={(e) => setQuadrant(Number(e.target.value))}
                          className="w-full appearance-none bg-transparent border-none p-0 focus:ring-0 text-base font-bold text-stone-700 pr-8 cursor-pointer"
                        >
                          {quadrantOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="p-8">
                      <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-3">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-bold text-stone-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="p-8">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-3">
                      Context & Details
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add any additional notes here..."
                      rows={3}
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-medium text-stone-600 placeholder:text-stone-200 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-5 px-8 border-2 border-stone-100 text-stone-500 rounded-[1.5rem] font-bold hover:bg-stone-50 hover:border-stone-200 transition-all text-base"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-5 px-8 bg-orange-500 text-white rounded-[1.5rem] font-bold hover:bg-orange-600 active:scale-[0.97] transition-all shadow-[0_20px_40px_-12px_rgba(249,115,22,0.4)] text-base flex items-center justify-center gap-3"
                  >
                    <Plus className="h-6 w-6" />
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
