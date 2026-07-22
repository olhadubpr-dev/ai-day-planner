import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Task } from "../types";

interface TodayScreenProps {
  todayTasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onMoveToInbox: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onReplanDay: (userPrompt: string) => Promise<void>;
  onNavigateToCapture: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  todayTasks,
  onToggleComplete,
  onToggleSubtask,
  onMoveToInbox,
  onDeleteTask,
  onEditTask,
  onReplanDay,
  onNavigateToCapture,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [replanPrompt, setReplanPrompt] = useState("");
  const [isReplanning, setIsReplanning] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ["All", ...Array.from(new Set(todayTasks.map((t) => t.category).filter(Boolean)))];

  const filteredTasks = todayTasks.filter((t) =>
    selectedCategory === "All" ? true : t.category === selectedCategory
  );

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalMinutes = todayTasks.reduce((acc, t) => acc + (t.completed ? 0 : t.durationMinutes || 30), 0);
  const formatTimeMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} хв`;
    return `${h} год ${m > 0 ? `${m} хв` : ""}`;
  };

  const handleReplanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReplanning(true);
    try {
      await onReplanDay(replanPrompt);
      setShowReplanModal(false);
      setReplanPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplanning(false);
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-l-4 border-l-rose-500";
      case "Medium":
        return "border-l-4 border-l-amber-500";
      case "Low":
        return "border-l-4 border-l-sky-500";
      default:
        return "border-l-4 border-l-slate-700";
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Крок 3: Сьогодні (План на день)</span>
          </div>

          {todayTasks.length > 1 && (
            <button
              onClick={() => setShowReplanModal(true)}
              className="py-1.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Оптимізувати день AI</span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
            <span>Прогрес дня: {completedCount} з {totalCount} виконано ({progressPercent}%)</span>
            <span className="text-slate-400 text-[11px]">Залишилось: {formatTimeMinutes(totalMinutes)}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1 px-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat === "All" ? "Всі категорії" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-300 text-base">План на сьогодні порожній</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Перенесіть задачі із Завдань або додайте нові задачі голосом через Потік.
            </p>
          </div>
          <button
            onClick={onNavigateToCapture}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Захопити нові думки</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isExpanded = expandedTasks[task.id] ?? true;
            return (
              <div
                key={task.id}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all space-y-3 ${getPriorityBorder(
                  task.priority
                )} ${task.completed ? "opacity-60 bg-slate-900/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Checkbox and Title */}
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div
                        className={`font-semibold text-sm md:text-base leading-snug ${
                          task.completed ? "line-through text-slate-500" : "text-slate-100"
                        }`}
                      >
                        {task.title}
                      </div>

                      {/* Time and Details */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {task.time && (
                          <span className="font-bold text-indigo-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.time}
                          </span>
                        )}
                        <span>• {task.durationMinutes} хв</span>
                        {task.category && <span className="text-slate-500">• {task.category}</span>}
                        {task.energyLevel && (
                          <span className="text-slate-500 flex items-center gap-0.5">
                            • <Zap className="w-2.5 h-2.5 text-amber-400" /> {task.energyLevel}
                          </span>
                        )}
                      </div>

                      {/* AI Reasoning / Advice reason if generated */}
                      {task.adviceReason && (
                        <div className="text-[11px] text-indigo-300/80 bg-indigo-950/30 px-2 py-1 rounded-md border border-indigo-500/10 inline-block mt-1">
                          💡 {task.adviceReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onMoveToInbox(task.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg text-xs"
                      title="Повернути в Завдання"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg text-xs"
                      title="Редагувати"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-xs"
                      title="Видалити"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Section */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="pl-8 pt-1 border-t border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-medium text-[11px]">
                        Підзадачі ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}):
                      </span>
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-0.5"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-1.5">
                        {task.subtasks.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => onToggleSubtask(task.id, sub.id)}
                            className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-indigo-500 rounded cursor-pointer"
                            />
                            <span className={sub.completed ? "line-through text-slate-500" : ""}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Re-plan Modal */}
      {showReplanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3>Оптимізувати графік дня через AI</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Опишіть свої побажання чи обмеження (наприклад: "У мене зустрічі з 14:00 до 15:30, важкі задачі постав на ранок, а легкі ввечері").
            </p>

            <form onSubmit={handleReplanSubmit} className="space-y-4">
              <textarea
                value={replanPrompt}
                onChange={(e) => setReplanPrompt(e.target.value)}
                rows={3}
                placeholder="Опишіть побажання щодо перепланування..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReplanModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isReplanning}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md"
                >
                  {isReplanning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Оптимізую...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Перепланувати</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
