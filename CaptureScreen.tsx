import React from "react";
import { BarChart2, CheckCircle2, Zap, Clock, ShieldCheck, Download, Trash2 } from "lucide-react";
import { Task } from "../types";
import { formatDuration } from "../lib/taskSorter";

interface AnalyticsScreenProps {
  tasks: Task[];
  onClearAll: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ tasks, onClearAll }) => {
  const completed = tasks.filter((t) => t.completed);
  const total = tasks.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  const totalMinutesSaved = completed.reduce((acc, t) => acc + (t.durationMinutes || 30), 0);

  const energyCounts = {
    High: tasks.filter((t) => t.energyLevel === "High").length,
    Medium: tasks.filter((t) => t.energyLevel === "Medium").length,
    Low: tasks.filter((t) => t.energyLevel === "Low").length,
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai-day-planner-backup-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
          <BarChart2 className="w-4.5 h-4.5" />
          <span>Аналітика продуктивності</span>
        </div>
        <p className="text-xs text-slate-300">
          Підсумки виконаної роботи та оцінка витраченого часу.
        </p>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Виконано задач</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {completed.length} <span className="text-xs text-slate-500 font-normal">/ {total}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Час виконаних задач</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatDuration(totalMinutesSaved)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Ефективність</span>
          </div>
          <div className="text-2xl font-bold text-white">{completionRate}%</div>
        </div>
      </div>

      {/* Energy levels breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>Баланс навантаження за енергією</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span>Високий фокус (High Energy):</span>
            <span className="font-bold text-purple-400">{energyCounts.High} задач</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Стандартний (Medium Energy):</span>
            <span className="font-bold text-blue-400">{energyCounts.Medium} задач</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Легка рутина (Low Energy):</span>
            <span className="font-bold text-emerald-400">{energyCounts.Low} задач</span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white text-sm">Управління даними</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportJson}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Завантажити бэкап (JSON)</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm("Ви дійсно хочете очистити всі збережені задачі?")) {
                onClearAll();
              }
            }}
            className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Очистити дані</span>
          </button>
        </div>
      </div>
    </div>
  );
};
