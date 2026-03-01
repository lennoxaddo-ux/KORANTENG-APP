import React from "react";
import { Task } from "../types";
import { cn } from "../utils";
import { Trophy, CheckCircle2, Flame, Sparkles, Target } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

interface CelebrationZoneProps {
  tasks: Task[];
}

export function CelebrationZone({ tasks }: CelebrationZoneProps) {
  const completedTasks = tasks.filter((t) => t.completed).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  
  // Get tasks completed today
  const today = new Date().toDateString();
  const completedToday = completedTasks.filter(t => new Date(t.created_at).toDateString() === today);

  return (
    <div className="flex flex-col rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm overflow-hidden relative h-fit">
      {/* Decorative background elements */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-100/50 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Celebration Zone</h2>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-widest">Your Accomplishments</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-orange-500 font-bold">
              <Flame className="h-5 w-5 fill-orange-500" />
              <span className="text-xl">{completedToday.length}</span>
            </div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">Wins Today</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-4 mb-8">
          <div className="relative h-4 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-orange-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] font-black text-stone-600 uppercase tracking-tighter">Dopamine Meter</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-orange-500" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Efficiency</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-stone-900">{completionRate}%</span>
                <span className="text-[10px] font-bold text-emerald-500">Done</span>
              </div>
            </div>
            
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-emerald-50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Total Wins</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-stone-900">{completedTasks.length}</span>
                <span className="text-[10px] font-bold text-emerald-500">Tasks</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-4">Recent Victories</h3>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {completedTasks.length > 0 ? (
              completedTasks.slice(0, 10).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center gap-3 rounded-xl bg-white/80 border border-emerald-100 p-3 shadow-sm hover:border-emerald-300 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate leading-tight">{task.title}</p>
                    <p className="text-[10px] text-stone-400 font-medium">
                      Completed {format(new Date(task.created_at), "MMM d")}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-stone-300 border-2 border-dashed border-emerald-100 rounded-2xl">
                <Trophy className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">No wins yet today</p>
                <p className="text-[10px] mt-1">Complete a task to see it here!</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
