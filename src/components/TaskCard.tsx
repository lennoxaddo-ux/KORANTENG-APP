import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types";
import { cn } from "../utils";
import { Calendar, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { motion, AnimatePresence } from "motion/react";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (task: Task) => void;
  key?: string;
}

export function TaskCard({ task, onToggleComplete, onDelete, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) && !task.completed;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(task)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md cursor-pointer",
        task.completed ? "bg-stone-50 border-stone-200" : "bg-white border-stone-200",
        isDragging && "z-50 cursor-grabbing ring-2 ring-indigo-500"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task.id);
          }}
          className="mt-1 shrink-0 text-stone-400 hover:text-indigo-600 transition-colors"
        >
          <AnimatePresence mode="wait">
            {task.completed ? (
              <motion.div
                key="completed"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
              </motion.div>
            ) : (
              <motion.div
                key="incomplete"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Circle className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-sm font-medium leading-tight",
            task.completed ? "text-stone-400 line-through" : "text-stone-900"
          )}>
            {task.title}
          </h3>
          {task.description && (
            <p className={cn(
              "mt-1 text-xs line-clamp-2",
              task.completed ? "text-stone-300" : "text-stone-500"
            )}>
              {task.description}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-stone-400 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {task.deadline && (
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider",
          isOverdue ? "text-red-500" : "text-stone-400"
        )}>
          <Calendar className="h-3 w-3" />
          {format(new Date(task.deadline), "MMM d, yyyy")}
        </div>
      )}
    </motion.div>
  );
}
