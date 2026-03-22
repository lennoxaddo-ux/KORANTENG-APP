import React, { useState, useEffect } from "react";
import { ProjectAspect, HealthStatus } from "../types";
import { Activity, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Edit3, Save, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";

interface ProjectNerveCenterProps {
  aspects: ProjectAspect[];
  onUpdateAspect: (id: string, updates: Partial<ProjectAspect>) => void;
  onInitialize?: () => void;
  onAddAspect?: (name: string) => void;
  onDeleteAspect?: (id: string) => void;
  isInitializing?: boolean;
}

export function ProjectNerveCenter({ 
  aspects, 
  onUpdateAspect, 
  onInitialize, 
  onAddAspect, 
  onDeleteAspect,
  isInitializing = false
}: ProjectNerveCenterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ProjectAspect>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim() && onAddAspect) {
      onAddAspect(newName.trim());
      setNewName("");
      setIsAdding(false);
    }
  };

  const handleStartEdit = (aspect: ProjectAspect) => {
    setEditingId(aspect.id);
    setEditValues({
      name: aspect.name,
      progress: aspect.progress,
      health: aspect.health,
      next_milestone: aspect.next_milestone
    });
  };

  const handleSave = (id: string) => {
    onUpdateAspect(id, editValues);
    setEditingId(null);
  };

  const getHealthColor = (health: HealthStatus) => {
    switch (health) {
      case "green": return "text-emerald-500 bg-emerald-50 border-emerald-100";
      case "yellow": return "text-amber-500 bg-amber-50 border-amber-100";
      case "red": return "text-rose-500 bg-rose-50 border-rose-100";
      default: return "text-stone-400 bg-stone-50 border-stone-100";
    }
  };

  const getHealthIcon = (health: HealthStatus) => {
    switch (health) {
      case "green": return <CheckCircle2 className="h-4 w-4" />;
      case "yellow": return <AlertCircle className="h-4 w-4" />;
      case "red": return <AlertCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const avgProgress = aspects.length > 0 
    ? Math.round(aspects.reduce((acc, a) => acc + a.progress, 0) / aspects.length) 
    : 0;

  if (aspects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-stone-200 bg-stone-50/50 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Activity className="h-8 w-8 text-stone-300" />
        </div>
        <h3 className="text-lg font-black text-stone-900">No workstreams found</h3>
        <p className="max-w-xs text-sm font-bold text-stone-500 mb-6">
          The Nerve Center is currently offline. Please ensure your project aspects are correctly initialized in the database.
        </p>
        {onInitialize && (
          <button
            onClick={onInitialize}
            disabled={isInitializing}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isInitializing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {isInitializing ? "Initializing..." : "Initialize Nerve Center"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">Active Workstreams</h2>
        {onAddAspect && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-stone-800 transition-all"
          >
            <Activity className="h-4 w-4" />
            Add Workstream
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-[2rem] border-2 border-indigo-100 bg-indigo-50/30 p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Workstream Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Infrastructure, QA, Legal..."
                    className="w-full rounded-xl border-none bg-white p-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="rounded-xl bg-white p-3 text-stone-400 hover:text-stone-600 shadow-sm transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {aspects.map((aspect) => (
          <motion.div
            key={aspect.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight text-stone-900">{aspect.name}</h3>
                <div className={cn(
                  "mt-2 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                  getHealthColor(aspect.health)
                )}>
                  {getHealthIcon(aspect.health)}
                  {aspect.health} status
                </div>
              </div>
              {editingId !== aspect.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(aspect)}
                    className="rounded-full p-2 text-stone-300 hover:bg-stone-50 hover:text-stone-600 transition-all"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {onDeleteAspect && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${aspect.name}?`)) {
                          onDeleteAspect(aspect.id);
                        }
                      }}
                      className="rounded-full p-2 text-stone-300 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Progress Section */}
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Progress</span>
                  <span className="text-xl font-black text-stone-900">{aspect.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${aspect.progress}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      aspect.health === "green" ? "bg-emerald-500" :
                      aspect.health === "yellow" ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />
                </div>
              </div>

              {/* Milestone Section */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Next Milestone</span>
                <div className="flex items-start gap-2 rounded-xl bg-stone-50 p-3">
                  <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" />
                  <p className="text-xs font-bold leading-tight text-stone-600">{aspect.next_milestone}</p>
                </div>
              </div>
            </div>

            {/* Edit Overlay */}
            <AnimatePresence>
              {editingId === aspect.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col rounded-[2rem] bg-white p-6"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-black tracking-tight text-stone-900">Edit {aspect.name}</h3>
                    <button onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Aspect Name</label>
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 p-3 text-xs font-bold text-stone-900 focus:border-indigo-500 focus:ring-0 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Progress (%)</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editValues.progress}
                        onChange={(e) => setEditValues({ ...editValues, progress: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                      <div className="text-right text-xs font-bold text-stone-600">{editValues.progress}%</div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Health Status</label>
                      <div className="flex gap-2">
                        {(["green", "yellow", "red"] as HealthStatus[]).map((h) => (
                          <button
                            key={h}
                            onClick={() => setEditValues({ ...editValues, health: h })}
                            className={cn(
                              "flex-1 rounded-lg border py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                              editValues.health === h 
                                ? "bg-stone-900 text-white border-stone-900" 
                                : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"
                            )}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Next Milestone</label>
                      <input
                        type="text"
                        value={editValues.next_milestone}
                        onChange={(e) => setEditValues({ ...editValues, next_milestone: e.target.value })}
                        className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 p-3 text-xs font-bold text-stone-900 focus:border-indigo-500 focus:ring-0 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSave(aspect.id)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    Save Aspect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="rounded-[2.5rem] bg-stone-900 p-8 text-white shadow-2xl shadow-stone-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Project Momentum</h2>
              <p className="text-sm font-bold text-stone-400">Aggregated health across all workstreams</p>
            </div>
          </div>
          
          <div className="flex gap-12">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1">Avg Progress</p>
              <p className="text-3xl font-black">
                {avgProgress}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1">Workstreams</p>
              <p className="text-3xl font-black">{aspects.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-1">Critical Issues</p>
              <p className="text-3xl font-black text-rose-400">
                {aspects.filter(a => a.health === "red").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
