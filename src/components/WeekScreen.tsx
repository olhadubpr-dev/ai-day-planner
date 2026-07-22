import React from "react";
import { CalendarDays, Clock, CheckCircle2, Circle, Plus, Edit2 } from "lucide-react";
import { Task } from "../types";

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
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const todayTasks = tasks.filter((t) => !t.deadline || t.deadline === todayStr);
  const tomorrowTasks = tasks.filter((t) => t.deadline === tomorrowStr);
  const upcomingTasks = tasks.filter(
    (t) => t.deadline && t.deadline !== todayStr && t.deadline !== tomorrowStr
  );

  const calculateHours = (taskList: Task[]) => {
    const mins = taskList.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);
    return (mins / 60).toFixed(1);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <CalendarDays className="w-4 h-4" />
          <span>Планування на тиждень</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Розподіл навантаження
        </h2>
        <p className="text-xs text-slate-300">
          Тут відображаються всі задачі, розраховані по днях. Натисніть на задачу, щоб змінити її дату, або скористайтесь кнопкою додавання.
        </p>
        <p className="text-xs text-slate-400">
          Загальний час виконання всіх запланованих задач: <strong className="text-indigo-300">{calculateHours(tasks)} год</strong>.
        </p>
      </div>

      {/* Today Bucket */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Сьогодні ({todayTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(todayTasks)} год</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => onAddNewTaskWithDeadline(todayStr)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
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
            {todayTasks.map((t) => (
              <div
                key={t.id}
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all cursor-pointer"
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
                  <span className={t.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>{t.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>{t.time || `${t.durationMinutes}хв`}</span>
                  <Edit2 className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tomorrow Bucket */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            Завтра ({tomorrowTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(tomorrowTasks)} год</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => onAddNewTaskWithDeadline(tomorrowStr)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>На завтра</span>
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
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all cursor-pointer"
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
                  <span className={t.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>{t.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>{t.time || `${t.durationMinutes}хв`}</span>
                  <Edit2 className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Later this week */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Пізніше цього тижня ({upcomingTasks.length})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{calculateHours(upcomingTasks)} год</span>
            {onAddNewTaskWithDeadline && (
              <button
                onClick={() => {
                  const future = new Date();
                  future.setDate(future.getDate() + 3);
                  onAddNewTaskWithDeadline(future.toISOString().split("T")[0]);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>На пізніше</span>
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
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-all cursor-pointer"
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
                  <span className={t.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>{t.title}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300/80">{t.deadline}</span>
                  <Edit2 className="w-3 h-3 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
