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
  AlertCircle,
  History
} from "lucide-react";
import { Task } from "../types";
import { sortTasks, isCarriedOverTask, getDeadlineBadge, formatDuration, getEnergyLabel } from "../lib/taskSorter";
import { QuickTaskTagEditor } from "./QuickTaskTagEditor";

interface TodayScreenProps {
  todayTasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onMoveToInbox: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskField?: (taskId: string, fields: Partial<Task>) => void;
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
  onUpdateTaskField,
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

  const todayStr = new Date().toISOString().split("T")[0];

  // Strictly filter for TodayScreen: ONLY tasks with a deadline that is today or past (carried over)!
  // Tasks WITHOUT a deadline or with FUTURE deadlines are EXCLUDED from TodayScreen!
  const strictlyTodayTasks = todayTasks.filter((t) => {
    if (!t.deadline) return false;
    const taskDl = t.deadline.split("T")[0];
    return taskDl <= todayStr || isCarriedOverTask(t, todayStr);
  });

  const categories = ["All", ...Array.from(new Set(strictlyTodayTasks.map((t) => t.category).filter(Boolean)))];

  const filteredTasks = strictlyTodayTasks.filter((t) =>
    selectedCategory === "All" ? true : t.category === selectedCategory
  );

  const carriedOverCount = strictlyTodayTasks.filter((t) => isCarriedOverTask(t, todayStr)).length;

  const sortedTasks = sortTasks(filteredTasks, todayStr);

  const completedCount = strictlyTodayTasks.filter((t) => t.completed).length;
  const totalCount = strictlyTodayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalMinutes = strictlyTodayTasks.reduce((acc, t) => acc + (t.completed ? 0 : t.durationMinutes || 30), 0);
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
        return "border-l-4 !border-l-rose-500";
      case "Medium":
        return "border-l-4 !border-l-amber-500";
      case "Low":
        return "border-l-4 !border-l-emerald-500";
      default:
        return "border-l-4 !border-l-slate-700";
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Високий
          </span>
        );
      case "Medium":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Середній
          </span>
        );
      case "Low":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Низький
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Calendar className="w-4 h-4" />
            <span>План на {getDeadlineBadge(todayStr, todayStr).label.replace("Сьогодні", "сьогодні")}</span>
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

      {/* Carried Over Alert Banner */}
      {carriedOverCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5 sm:mt-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-200 text-sm flex items-center gap-2">
                <span>У вас {carriedOverCount} {carriedOverCount === 1 ? "невиконане завдання" : "невиконаних завдань"} з минулих днів!</span>
              </div>
              <div className="text-slate-300 text-[11px] mt-0.5">
                Вони тепер закріплені нагорі списку, наздоганяйте!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {sortedTasks.length === 0 ? (
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
          {sortedTasks.map((task) => {
            const isExpanded = expandedTasks[task.id] ?? true;
            const isCarried = isCarriedOverTask(task, todayStr);

            return (
              <div
                key={task.id}
                className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all space-y-3 ${getPriorityBorder(
                  task.priority
                )} ${isCarried ? "bg-amber-950/10 border-amber-500/30" : ""} ${
                  task.completed ? "opacity-60 bg-slate-900/40" : ""
                }`}
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

                    <div className="space-y-1.5">
                      {/* Carried Over Badge */}
                      {isCarried && (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                            <History className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Привіт з минулого</span>
                          </span>
                        </div>
                      )}

                      <div
                        className={`font-semibold text-sm md:text-base leading-snug ${
                          task.completed ? "line-through text-slate-500" : "text-slate-100"
                        }`}
                      >
                        {task.title}
                      </div>

                      {/* Interactive Meta Tags */}
                      {onUpdateTaskField ? (
                        <QuickTaskTagEditor
                          task={task}
                          onUpdateTaskField={onUpdateTaskField}
                          showDeadline={false}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          {renderPriorityBadge(task.priority)}
                          {task.time && (
                            <span className="font-bold text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {task.time}
                            </span>
                          )}
                          <span>• {formatDuration(task.durationMinutes)}</span>
                          {task.category && <span className="text-slate-500">• {task.category}</span>}
                        </div>
                      )}

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
