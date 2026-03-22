import React, { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { MasterList } from "./components/MasterList";
import { MatrixGrid } from "./components/MatrixGrid";
import { TaskForm } from "./components/TaskForm";
import { TaskCard } from "./components/TaskCard";
import { TaskDetailModal } from "./components/TaskDetailModal";
import { SyncButton } from "./components/SyncButton";
import { ProjectNerveCenter } from "./components/ProjectNerveCenter";
import { CelebrationZone } from "./components/CelebrationZone";
import { LayoutGrid, List, CalendarDays, Calendar as CalendarIcon, Loader2, Trophy, Activity } from "lucide-react";
import { cn } from "./utils";
import { motion, AnimatePresence } from "motion/react";
import { isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { QuadrantType, Task, ViewType, ProjectAspect } from "./types";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [aspects, setAspects] = useState<ProjectAspect[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [view, setView] = useState<ViewType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isAspectsLoading, setIsAspectsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    const localTasks = localStorage.getItem("koranteng_tasks");
    if (localTasks) {
      setTasks(JSON.parse(localTasks));
      setIsLoading(false);
    }
    fetchTasks();
    fetchAspects();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("koranteng_tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      const serverTasks = data.map((t: any) => ({ ...t, completed: !!t.completed }));
      setTasks(serverTasks);
      setLastSynced(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAspects = async () => {
    setIsAspectsLoading(true);
    try {
      const response = await fetch("/api/aspects");
      if (!response.ok) throw new Error("Failed to fetch aspects");
      const data = await response.json();
      setAspects(data);
    } catch (error) {
      console.error("Failed to fetch aspects:", error);
    } finally {
      setIsAspectsLoading(false);
    }
  };

  const handleUpdateAspect = async (id: string, updates: Partial<ProjectAspect>) => {
    setAspects((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    setHasUnsavedChanges(true);

    try {
      await fetch(`/api/aspects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setHasUnsavedChanges(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to update aspect:", error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // For simplicity, we'll push all tasks to the server.
      // In a real app, we'd only push changes.
      // But since we have a per-task API, we'll just re-fetch to see if we're in sync
      // or implement a bulk update if needed.
      // For now, let's just re-fetch and assume the user wants to ensure server matches local.
      // Actually, let's just re-fetch to verify connection and update lastSynced.
      await fetchTasks();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddTask = async (newTask: { title: string; description: string; deadline: string | null; quadrant: QuadrantType }) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const task: Task = {
      id,
      ...newTask,
      completed: false,
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [task, ...prev]);
    setHasUnsavedChanges(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error("Failed to save task");
      setHasUnsavedChanges(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to add task:", error);
      // We keep hasUnsavedChanges = true so the user can retry
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    setHasUnsavedChanges(true);
    if (selectedTask?.id === id) {
      setSelectedTask(updatedTask);
    }

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: updatedTask.completed }),
      });
      setHasUnsavedChanges(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, ...updates };
    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    setHasUnsavedChanges(true);
    if (selectedTask?.id === id) {
      setSelectedTask(updatedTask);
    }

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setHasUnsavedChanges(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to update task details:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setHasUnsavedChanges(true);

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      setHasUnsavedChanges(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle dropping into a quadrant
    if (overId.startsWith("quadrant-")) {
      const newQuadrant = parseInt(overId.replace("quadrant-", "")) as QuadrantType;
      const task = tasks.find((t) => t.id === activeId);
      
      if (task && task.quadrant !== newQuadrant) {
        setTasks((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, quadrant: newQuadrant } : t))
        );
        setHasUnsavedChanges(true);

        try {
          await fetch(`/api/tasks/${activeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quadrant: newQuadrant }),
          });
          setHasUnsavedChanges(false);
          setLastSynced(new Date());
        } catch (error) {
          console.error("Failed to update task quadrant:", error);
        }
      }
    } 
    // Handle reordering within the same quadrant (simplified)
    else if (activeId !== overId) {
      setTasks((items) => {
        const oldIndex = items.findIndex((t) => t.id === activeId);
        const newIndex = items.findIndex((t) => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (view === "all") return true;
    if (!task.deadline) return true;
    
    const date = new Date(task.deadline);
    const now = new Date();

    if (view === "daily") {
      return isWithinInterval(date, {
        start: startOfDay(now),
        end: endOfDay(now),
      });
    } else if (view === "weekly") {
      return isWithinInterval(date, {
        start: startOfWeek(now),
        end: endOfWeek(now),
      });
    }
    return true;
  });

  const backlogTasks = tasks.filter(t => t.quadrant === QuadrantType.BACKLOG);
  const matrixTasks = filteredTasks.filter(t => t.quadrant !== QuadrantType.BACKLOG);
  const hiddenTasksCount = tasks.filter(t => t.quadrant !== QuadrantType.BACKLOG).length - matrixTasks.length;

  if (isLoading || (view === "nerve-center" && isAspectsLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-stone-500">Loading your matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">KORANTENG</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Decisive planning</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SyncButton 
              isSyncing={isSyncing} 
              hasUnsavedChanges={hasUnsavedChanges} 
              onSync={handleSync} 
              lastSynced={lastSynced}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center rounded-xl bg-stone-100 p-1 w-fit">
            <button
              onClick={() => setView("all")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all",
                view === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              All Tasks
            </button>
            <button
              onClick={() => setView("daily")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all",
                view === "daily" ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Daily
            </button>
            <button
              onClick={() => setView("weekly")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all",
                view === "weekly" ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Weekly
            </button>
            <button
              onClick={() => setView("nerve-center")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold transition-all",
                view === "nerve-center" ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Nerve Center
            </button>
          </div>
          <div className="flex items-center justify-end">
            <TaskForm onAdd={handleAddTask} />
          </div>
        </div>

        {view === "nerve-center" ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-stone-900 tracking-tight">Project Nerve Center</h2>
                <p className="text-sm font-bold text-stone-500">Real-time health and progress across all project workstreams.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black text-stone-400 bg-white px-4 py-2 rounded-2xl border border-stone-100 shadow-sm self-start sm:self-auto uppercase tracking-widest">
                <Activity className="h-4 w-4 text-indigo-500" />
                Live Monitoring
              </div>
            </div>
            <ProjectNerveCenter aspects={aspects} onUpdateAspect={handleUpdateAspect} />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sidebar: Master List + Celebration Zone */}
              <div className="lg:col-span-4 xl:col-span-3 space-y-8">
                <MasterList
                  tasks={backlogTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onAdd={handleAddTask}
                  onTaskClick={handleTaskClick}
                />
                
                <CelebrationZone tasks={tasks} />
              </div>

              {/* Main Content: Matrix Grid */}
              <div className="lg:col-span-8 xl:col-span-9">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">
                      {view === "daily" ? "Today's Priorities" : view === "weekly" ? "Weekly Strategy" : "All Priorities"}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {view === "daily" 
                        ? "Focus on what matters right now." 
                        : view === "weekly"
                        ? "Plan your week for maximum impact."
                        : "View all your categorized tasks."}
                    </p>
                    {hiddenTasksCount > 0 && (
                      <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-wider">
                        + {hiddenTasksCount} tasks hidden by date filter
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-400 bg-white px-3 py-1.5 rounded-lg border border-stone-100 shadow-sm self-start sm:self-auto">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    {tasks.filter(t => t.completed).length} Completed
                  </div>
                </div>

                <MatrixGrid
                  tasks={matrixTasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onTaskClick={handleTaskClick}
                />
              </div>
            </div>

            <TaskDetailModal
              task={selectedTask}
              isOpen={isDetailOpen}
              onClose={() => setIsDetailOpen(false)}
              onUpdate={handleUpdateTask}
              onDelete={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
            />

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: "0.5",
                  },
                },
              }),
            }}>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  onToggleComplete={() => {}}
                  onDelete={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      <footer className="mt-auto border-t border-stone-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-stone-400 italic">
            "Regardless of anyting, difficult take a day impossible takes a week"
          </p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-300">
            — LENNOX KORANTENG-ADDO
          </p>
        </div>
      </footer>
    </div>
  );
}
