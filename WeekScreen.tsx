import React from "react";
import { Inbox, CalendarPlus, Trash2, Edit3, ArrowRight, Clock, Zap, Tag, CheckCircle2, Plus } from "lucide-react";
import { Task } from "../types";
import { sortTasks, isCarriedOverTask, getDeadlineBadge, formatDuration } from "../lib/taskSorter";
import { QuickTaskTagEditor } from "./QuickTaskTagEditor";

interface InboxScreenProps {
  inboxTasks: Task[];
  onToggleComplete?: (taskId: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onMoveToToday: (taskId: string) => void;
  onMoveToTomorrow: (taskId: string) => void;
  onMoveAllToToday: () => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskField?: (taskId: string, fields: Partial<Task>) => void;
  onAddNewManualTask: () => void;
  onNavigateToCapture: () => void;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  inboxTasks,
  onToggleComplete,
  onToggleSubtask,
  onMoveToToday,
  onMoveToTomorrow,
  onMoveAllToToday,
  onDeleteTask,
  onEditTask,
  onUpdateTaskField,
  onAddNewManualTask,
  onNavigateToCapture,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold";
      case "Medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
      case "Low":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getPriorityBorderClass = (priority: string) => {
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

  const sortedInboxTasks = sortTasks(inboxTasks, todayStr);

  const getEnergyBadge = (energy: string) => {
    switch (energy) {
      case "High":
        return { label: "Високий фокус", color: "text-slate-300 bg-slate-800 border-slate-700" };
      case "Medium":
        return { label: "Стандартний", color: "text-slate-300 bg-slate-800 border-slate-700" };
      case "Low":
        return { label: "Легка рутина", color: "text-slate-300 bg-slate-800 border-slate-700" };
      default:
        return { label: energy, color: "text-slate-300 bg-slate-800 border-slate-700" };
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
            <Inbox className="w-4.5 h-4.5" />
            <span>Усі завдання ({inboxTasks.length})</span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Повний список усіх ваших задач: розплановані на "Сьогодні" та "Тиждень", завдання без дати і вже виконані. Заходьте сюди для швидкого пошуку чи редагування будь-яких деталей.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0">
          {inboxTasks.length > 0 && (
            <button
              onClick={onMoveAllToToday}
              className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Всі в Сьогодні &rarr;</span>
            </button>
          )}

          <button
            onClick={onAddNewManualTask}
            className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1 whitespace-nowrap shrink-0"
            title="Додати задачу"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Додати</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      {inboxTasks.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-300 text-base">Список завдань порожній!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Всі завдання розплановано або ще не додано. Надиктуйте нові ідеї в Потік.
            </p>
          </div>
          <button
            onClick={onNavigateToCapture}
            className="py-2.5 px-4 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 font-medium text-xs transition-all inline-flex items-center gap-2"
          >
            <span>Захопити думки в Потік &rarr;</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedInboxTasks.map((task) => {
            const energyInfo = getEnergyBadge(task.energyLevel);
            return (
              <div
                key={task.id}
                className={`bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3 group shadow-sm ${getPriorityBorderClass(
                  task.priority
                )} ${task.completed ? "opacity-60 bg-slate-900/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {onToggleComplete && (
                      <button
                        type="button"
                        onClick={() => onToggleComplete(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <span className="w-5 h-5 border-2 border-slate-600 rounded-full inline-block hover:border-indigo-400" />
                        )}
                      </button>
                    )}

                    <div className="space-y-1 flex-1">
                      <div
                        className={`font-semibold text-slate-100 text-sm md:text-base leading-snug ${
                          task.completed ? "line-through text-slate-500" : ""
                        }`}
                      >
                        {task.title}
                      </div>

                      {/* Interactive Meta Tags */}
                      {onUpdateTaskField ? (
                        <QuickTaskTagEditor
                          task={task}
                          onUpdateTaskField={onUpdateTaskField}
                          showDeadline={true}
                        />
                      ) : (
                        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] ${getDeadlineBadge(task.deadline).color}`}>
                            {getDeadlineBadge(task.deadline).label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority === "High" ? "Високий пріоритет" : task.priority === "Medium" ? "Середній" : "Низький"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Редагувати"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Видалити"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtasks preview if any */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2.5 text-xs space-y-1.5">
                    <div className="text-slate-500 font-medium text-[11px]">
                      Підзадачі ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}):
                    </div>
                    <div className="space-y-1 pl-1">
                      {task.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => onToggleSubtask?.(task.id, sub.id)}
                          className="text-slate-300 flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
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
                  </div>
                )}

                {/* Move / Schedule Action Buttons */}
                <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onMoveToToday(task.id)}
                    className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>На сьогодні</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => onMoveToTomorrow(task.id)}
                    className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>На завтра</span>
                  </button>

                  <button
                    onClick={() => onEditTask(task)}
                    className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>На пізніше</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
