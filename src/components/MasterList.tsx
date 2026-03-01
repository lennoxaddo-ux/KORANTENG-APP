import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { QuadrantType, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { cn } from "../utils";
import { Inbox } from "lucide-react";

import { VoiceTaskInput } from "./VoiceTaskInput";

interface MasterListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (task: { title: string; description: string; deadline: string | null; quadrant: QuadrantType }) => void;
  onTaskClick: (task: Task) => void;
}

export function MasterList({ tasks, onToggleComplete, onDelete, onAdd, onTaskClick }: MasterListProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-${QuadrantType.BACKLOG}`,
    data: { quadrant: QuadrantType.BACKLOG },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all h-fit",
        isOver && "bg-indigo-50 border-indigo-200"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Inbox className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Master Task List</h2>
            <p className="text-[11px] text-stone-500">Unsorted backlog</p>
          </div>
        </div>
        <VoiceTaskInput onAdd={onAdd} />
      </div>

      <div className={cn(
        "overflow-y-auto space-y-3 pr-1 transition-all duration-300",
        tasks.length === 0 ? "h-20" : "max-h-[300px] min-h-[100px]"
      )}>
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
          <div className="flex flex-col items-center justify-center h-40 text-stone-300 border-2 border-dashed border-stone-100 rounded-xl">
            <p className="text-xs font-medium">No tasks in backlog</p>
          </div>
        )}
      </div>
    </div>
  );
}
