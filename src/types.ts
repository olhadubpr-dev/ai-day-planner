export type Priority = "High" | "Medium" | "Low";
export type EnergyLevel = "High" | "Medium" | "Low";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  time: string | null;
  durationMinutes: number;
  category: string;
  energyLevel: EnergyLevel;
  deadline: string | null;
  subtasks: SubTask[];
  completed: boolean;
  createdAt?: string;
  tags?: string[];
  adviceReason?: string;
}

export type ActiveTab = "capture" | "inbox" | "today" | "week" | "analytics";

export interface ReplanRequest {
  tasks: Task[];
  userPrompt: string;
}
