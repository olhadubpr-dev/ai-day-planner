import React from "react";
import { Inbox, CalendarPlus, Trash2, Edit3, ArrowRight, Clock, Zap, Tag, CheckCircle2, Plus } from "lucide-react";
import { Task } from "../types";

interface InboxScreenProps {
  inboxTasks: Task[];
  onMoveToToday: (taskId: string) => void;
  onMoveToTomorrow: (taskId: string) => void;
  onMoveAllToToday: () => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddNewManualTask: () => void;
  onNavigateToCapture: () => void;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  inboxTasks,
  onMoveToToday,
  onMoveToTomorrow,
  onMoveAllToToday,
  onDeleteTask,
  onEditTask,
  onAddNewManualTask,
  onNavigateToCapture,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Low":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getEnergyBadge = (energy: string) => {
    switch (energy) {
      case "High":
        return { label: "Високий фокус", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "Medium":
        return { label: "Оптимальний", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "Low":
        return { label: "Легка рутина", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      default:
        return { label: energy, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Inbox className="w-4 h-4" />
            <span>Крок 2: Список завдань</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Список завдань ({inboxTasks.length})
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Нема в плані — нема ніде. Перевірте свої завдання і заплануйте, що зробимо сьогодні.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {inboxTasks.length > 0 && (
            <button
              onClick={onMoveAllToToday}
              className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Всі в Сьогодні &rarr;</span>
            </button>
          )}

          <button
            onClick={onAddNewManualTask}
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1"
            title="Додати задачу вручну"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Вручну</span>
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
          {inboxTasks.map((task) => {
            const energyInfo = getEnergyBadge(task.energyLevel);
            return (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="font-semibold text-slate-100 text-sm md:text-base leading-snug">
                      {task.title}
                    </div>

                    {/* Meta pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      {/* Priority */}
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority === "High" ? "Високий пріоритет" : task.priority === "Medium" ? "Середній" : "Низький"}
                      </span>

                      {/* Time & Duration */}
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{task.time ? task.time : "Без часу"} ({task.durationMinutes} хв)</span>
                      </span>

                      {/* Energy */}
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] flex items-center gap-1 ${energyInfo.color}`}>
                        <Zap className="w-3 h-3" />
                        <span>{energyInfo.label}</span>
                      </span>

                      {/* Category */}
                      {task.category && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/40 text-[11px]">
                          {task.category}
                        </span>
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
                    <div className="text-slate-500 font-medium text-[11px]">Підзадачі ({task.subtasks.length}):</div>
                    <div className="space-y-1 pl-1">
                      {task.subtasks.map((sub) => (
                        <div key={sub.id} className="text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                          <span>{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Move / Schedule Action Buttons */}
                <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onMoveToToday(task.id)}
                    className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>На сьогодні</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onMoveToTomorrow(task.id)}
                    className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>На завтра</span>
                  </button>

                  <button
                    onClick={() => onEditTask(task)}
                    className="flex-1 sm:flex-none py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>На пізніше (Календар)</span>
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
