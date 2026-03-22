export enum QuadrantType {
  BACKLOG = 0,
  DO = 1,
  SCHEDULE = 2,
  DELEGATE = 3,
  ELIMINATE = 4,
}

export interface Task {
  id: string;
  title: string;
  description: string;
  quadrant: QuadrantType;
  completed: boolean;
  deadline: string | null;
  created_at: string;
  notes?: string;
  attachments?: { name: string; url: string; type: string }[];
}

export type ViewType = "daily" | "weekly" | "all" | "nerve-center";

export type HealthStatus = "green" | "yellow" | "red";

export interface ProjectAspect {
  id: string;
  name: string;
  progress: number; // 0-100
  health: HealthStatus;
  next_milestone: string;
  updated_at: string;
}
