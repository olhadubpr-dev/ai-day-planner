import React from "react";
import { CalendarDays, Clock, CheckCircle2, Circle, Plus, Edit2, History } from "lucide-react";
import { Task } from "../types";
import { sortTasks, isCarriedOverTask, getDeadlineBadge, formatDuration } from "../lib/taskSorter";

interface WeekScreenProps {
  tasks: Task[];
  onToggleComplete: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onAddNewTaskWithDeadline?: (deadlineDate: string) => void;
}

export const WeekScreen: React.FC<WeekScreenProps> = ({
  tasks,
  onToggleComplete,
  onEditTask,
  onAddNewTaskWithDeadline,
}) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(now.getDate() + 1);
  const tYear = tomorrowObj.getFullYear();
  const tMonth = String(tomorrowObj.getMonth() + 1).padStart(2, "0");
  const tDay = String(tomorrowObj.getDate()).padStart(2, "0");
  const tomorrowStr = `${tYear}-${tMonth}-${tDay}`;

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "High":
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Високий пріоритет" />;
      case "Medium":
        return <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Середній пріоритет" />;
      case "Low":
        return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Низький пріоритет" />;
      default:
        return null;
    }
  };

  // Today tasks: MUST have a deadline that is today or past (carried over)
  const rawTodayTasks = tasks.filter(
    (t) => Boolean(t.deadline) && (t.deadline! <= todayStr || isCarriedOverTask(t, todayStr))
  );
  const todayTasks = sortTasks(rawTodayTasks, todayStr);

  // Tomorrow tasks: scheduled strictly for tomorrow
  const rawTomorrowTasks = tasks.filter(
    (t) => Boolean(t.deadline) && t.deadline === tomorrowStr
  );
  const tomorrowTasks = sortTasks(rawTomorrowTasks, todayStr);

  // Upcoming tasks: strictly FUTURE dates beyond tomorrow
  const rawUpcomingTasks = tasks.filter(
    (t) => Boolean(t.deadline) && t.deadline! > tomorrowStr
  );
  const upcomingTasks = sortTasks(rawUpcomingTasks, todayStr);

  // Undated tasks: tasks without any deadline set
  const rawUndatedTasks = tasks.filter(
    (t) => !t.deadline || !t.deadline.trim()
  );
  const undatedTasks = sortTasks(rawUndatedTasks, todayStr);

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

  const calculateHours = (taskList: Task[]) => {
    const active = (taskList || []).filter((t) => !t.completed);
    if (active.length === 0) return "0 хв";
    const mins = active.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
    return formatDuration(mins);
  };

  const carriedOverCountInWeek = todayTasks.filter((t) => isCarriedOverTask(t, todayStr)).length;

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
          <CalendarDays className="w-4.5 h-4.5" />
          <span>План на тиждень</span>
        </div>
        <p className="text-xs text-slate-300">
          Тут відображаються всі задачі, розраховані по днях. Невиконані задачі з попередніх днів автоматично переносяться на "Сьогодні".
        </p>
        <p className="text-xs text-slate-400">
          Загальний час виконання всіх запланованих задач: <strong className="text-indigo-300">{calculateHours(tasks)}</strong>.
        </p>
      </div>

      {/* Today Bucket */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">
              {getDeadlineBadge(todayStr, todayStr).label} ({todayTasks.length})
            </h3>
            {carriedOverCountInWeek > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <History className="w-3 h-3 text-amber-400" />
                {carriedOverCountInWeek} з минулого
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(todayTasks)}</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => onAddNewTaskWithDeadline(todayStr)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати</span>
              </button>
            )}
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">На сьогодні задач немає.</div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((t) => {
              const isCarried = isCarriedOverTask(t, todayStr);

              return (
                <div
                  key={t.id}
                  className={`bg-slate-950/60 p-3 rounded-xl border flex items-center justify-between text-xs hover:border-slate-700 transition-all cursor-pointer ${getPriorityBorderClass(
                    t.priority
                  )} ${
                    isCarried
                      ? "border-amber-500/40 bg-amber-950/10"
                      : "border-slate-800/80"
                  }`}
                  onClick={() => onEditTask?.(t)}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(t.id);
                      }}
                      className="text-slate-400 hover:text-emerald-400"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="space-y-0.5">
                      {isCarried && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                          <History className="w-2.5 h-2.5 text-amber-400" />
                          Привіт з минулого
                        </span>
                      )}
                      <div
                        className={`flex items-center gap-1.5 ${
                          t.completed
                            ? "line-through text-slate-500"
                            : "text-slate-200 font-medium"
                        }`}
                      >
                        {getPriorityDot(t.priority)}
                        <span>{t.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <span>{t.time ? `${t.time} (${formatDuration(t.durationMinutes)})` : formatDuration(t.durationMinutes)}</span>
                    <Edit2 className="w-3 h-3 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tomorrow Bucket */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-sm">
            {getDeadlineBadge(tomorrowStr, todayStr).label} ({tomorrowTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(tomorrowTasks)}</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => onAddNewTaskWithDeadline(tomorrowStr)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати</span>
              </button>
            )}
          </div>
        </div>

        {tomorrowTasks.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">На завтра задач ще не заплановано.</div>
        ) : (
          <div className="space-y-2">
            {tomorrowTasks.map((t) => (
              <div
                key={t.id}
                className={`bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all cursor-pointer ${getPriorityBorderClass(
                  t.priority
                )}`}
                onClick={() => onEditTask?.(t)}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(t.id);
                    }}
                    className="text-slate-400 hover:text-emerald-400"
                  >
                    {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div className="flex items-center gap-1.5">
                    {getPriorityDot(t.priority)}
                    <span className={t.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>{t.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>{t.time ? `${t.time} (${formatDuration(t.durationMinutes)})` : formatDuration(t.durationMinutes)}</span>
                  <Edit2 className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Later this week / Future */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-sm">
            Цього тижня або пізніше ({upcomingTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(upcomingTasks)}</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => {
                  const future = new Date();
                  future.setDate(future.getDate() + 3);
                  const fYear = future.getFullYear();
                  const fMonth = String(future.getMonth() + 1).padStart(2, "0");
                  const fDay = String(future.getDate()).padStart(2, "0");
                  onAddNewTaskWithDeadline(`${fYear}-${fMonth}-${fDay}`);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати</span>
              </button>
            )}
          </div>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">Задач на майбутні дні не знайдено.</div>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map((t) => (
              <div
                key={t.id}
                className={`bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all cursor-pointer ${getPriorityBorderClass(
                  t.priority
                )}`}
                onClick={() => onEditTask?.(t)}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(t.id);
                    }}
                    className="text-slate-400 hover:text-emerald-400"
                  >
                    {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div className="flex items-center gap-1.5">
                    {getPriorityDot(t.priority)}
                    <span className={t.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>{t.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium border border-slate-700/60">
                    {getDeadlineBadge(t.deadline, todayStr).label}
                  </span>
                  <Edit2 className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Undated Tasks Bucket */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-sm">
            Без дати / Потребують призначення ({undatedTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(undatedTasks)}</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => onAddNewTaskWithDeadline("")}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати</span>
              </button>
            )}
          </div>
        </div>

        {undatedTasks.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">
            Усі ваші завдання мають розплановані дати! 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {undatedTasks.map((t) => {
              const badge = getDeadlineBadge(t.deadline, todayStr);
              return (
                <div
                  key={t.id}
                  className={`bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-xs transition-all cursor-pointer ${getPriorityBorderClass(
                    t.priority
                  )}`}
                  onClick={() => onEditTask?.(t)}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(t.id);
                      }}
                      className="text-slate-400 hover:text-emerald-400"
                    >
                      {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-1.5">
                      {getPriorityDot(t.priority)}
                      <span className={t.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>
                        {t.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded border border-slate-700/60 bg-slate-800 text-slate-300 text-[10px]">
                      {badge.label}
                    </span>
                    <Edit2 className="w-3 h-3 text-slate-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

