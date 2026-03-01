import React from "react";
import { QuadrantType, Task } from "../types";
import { Quadrant } from "./Quadrant";

interface MatrixGridProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export function MatrixGrid({ tasks, onToggleComplete, onDelete, onTaskClick }: MatrixGridProps) {
  const getTasksByQuadrant = (q: QuadrantType) => tasks.filter((t) => t.quadrant === q);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <Quadrant
        id={QuadrantType.DO}
        title="Urgent & Important"
        subtitle="Do it immediately"
        tasks={getTasksByQuadrant(QuadrantType.DO)}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onTaskClick={onTaskClick}
        colorClass="bg-red-50/40 border-red-100 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)] hover:border-red-200"
      />
      <Quadrant
        id={QuadrantType.SCHEDULE}
        title="Not Urgent & Important"
        subtitle="Schedule for later"
        tasks={getTasksByQuadrant(QuadrantType.SCHEDULE)}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onTaskClick={onTaskClick}
        colorClass="bg-orange-50/40 border-orange-100 shadow-[0_0_30px_-5px_rgba(249,115,22,0.2)] hover:border-orange-200"
      />
      <Quadrant
        id={QuadrantType.DELEGATE}
        title="Urgent & Not Important"
        subtitle="Delegate to someone else"
        tasks={getTasksByQuadrant(QuadrantType.DELEGATE)}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onTaskClick={onTaskClick}
        colorClass="bg-yellow-50/40 border-yellow-100 shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)] hover:border-yellow-200"
      />
      <Quadrant
        id={QuadrantType.ELIMINATE}
        title="Not Urgent & Not Important"
        subtitle="Eliminate or ignore"
        tasks={getTasksByQuadrant(QuadrantType.ELIMINATE)}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onTaskClick={onTaskClick}
        colorClass="bg-blue-50/40 border-blue-100 shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)] hover:border-blue-200"
      />
    </div>
  );
}
