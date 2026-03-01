import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { QuadrantType, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { cn } from "../utils";
import { motion } from "motion/react";

interface QuadrantProps {
  id: QuadrantType;
  title: string;
  subtitle: string;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
  colorClass: string;
}

export function Quadrant({
  id,
  title,
  subtitle,
  tasks,
  onToggleComplete,
  onDelete,
  onTaskClick,
  colorClass,
}: QuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${id}`,
    data: { quadrant: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full min-h-[300px] rounded-2xl border-2 border-dashed p-4 transition-all duration-500",
        isOver ? "bg-indigo-50/50 border-indigo-400 scale-[1.02] z-10" : "",
        !isOver && colorClass,
        !isOver && !colorClass && "bg-stone-50/30 border-stone-100"
      )}
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-900">{title}</h2>
        <p className="text-[11px] italic text-stone-500">{subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-stone-300">
            <p className="text-xs font-medium">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}
