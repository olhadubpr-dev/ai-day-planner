import React, { useState, useRef, useEffect } from "react";
import { Clock, Zap, ChevronDown, Tag, Check, AlertCircle } from "lucide-react";
import { Task, Priority, EnergyLevel } from "../types";
import { formatDuration, getDeadlineBadge, getEnergyLabel, isTaskOverdueByTime } from "../lib/taskSorter";

interface QuickTaskTagEditorProps {
  task: Task;
  onUpdateTaskField: (taskId: string, fields: Partial<Task>) => void;
  showDeadline?: boolean;
}

export const QuickTaskTagEditor: React.FC<QuickTaskTagEditorProps> = ({
  task,
  onUpdateTaskField,
  showDeadline = true,
}) => {
  const [activeMenu, setActiveMenu] = useState<"priority" | "energy" | "time" | "category" | "deadline" | null>(null);
  const [customCategory, setCustomCategory] = useState(task.category || "");
  const [isEditingCategoryInput, setIsEditingCategoryInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const overdueByTime = isTaskOverdueByTime(task);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setIsEditingCategoryInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu: "priority" | "energy" | "time" | "category" | "deadline") => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
    if (menu === "category") {
      setCustomCategory(task.category || "");
    }
  };

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25";
      case "Medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25";
      case "Low":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25";
    }
  };

  const getEnergyBadgeClass = (energy: EnergyLevel) => {
    return "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700/80";
  };

  const categories = ["Загальні", "Робота", "Особисте", "Здоров'я", "Навчання", "Фінанси"];

  const handleDeadlineSelect = (option: "today" | "tomorrow" | "inbox") => {
    let deadline: string | null = null;
    const now = new Date();
    if (option === "today") {
      deadline = now.toISOString().split("T")[0];
    } else if (option === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      deadline = tomorrow.toISOString().split("T")[0];
    } else if (option === "inbox") {
      deadline = null;
    }
    onUpdateTaskField(task.id, { deadline });
    setActiveMenu(null);
  };

  const dlBadge = getDeadlineBadge(task.deadline);

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-1.5 text-xs pt-1 relative">
      {/* 1. DEADLINE BADGE */}
      {showDeadline && (
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => toggleMenu("deadline")}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer group ${dlBadge.color} hover:brightness-125`}
            title="Швидка зміна терміну виконання"
          >
            <span>{dlBadge.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>

          {activeMenu === "deadline" && (
            <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-800">
                Термін виконання
              </div>
              <button
                type="button"
                onClick={() => handleDeadlineSelect("today")}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-indigo-300 font-medium flex items-center justify-between"
              >
                <span>✨ На сьогодні</span>
                {task.deadline === new Date().toISOString().split("T")[0] && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleDeadlineSelect("tomorrow")}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>🌅 На завтра</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeadlineSelect("inbox")}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-400 flex items-center justify-between"
              >
                <span>📥 Без дати (У Завдання)</span>
                {!task.deadline && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. PRIORITY BADGE */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => toggleMenu("priority")}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer group ${getPriorityBadgeClass(
            task.priority
          )}`}
          title="Швидка зміна пріоритету"
        >
          <span>
            {task.priority === "High"
              ? "Високий пріоритет"
              : task.priority === "Medium"
              ? "Середній пріоритет"
              : "Низький пріоритет"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        {activeMenu === "priority" && (
          <div className="absolute left-0 mt-1.5 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-800">
              Пріоритет
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateTaskField(task.id, { priority: "High" });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-rose-500/20 text-rose-300 font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Високий
              </span>
              {task.priority === "High" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateTaskField(task.id, { priority: "Medium" });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-amber-500/20 text-amber-300 font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Середній
              </span>
              {task.priority === "Medium" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateTaskField(task.id, { priority: "Low" });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-500/20 text-emerald-300 font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Низький
              </span>
              {task.priority === "Low" && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 3. TIME & DURATION BADGE */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => toggleMenu("time")}
          className="px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer group bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border-slate-700/60"
          title="Швидка зміна часу та тривалості"
        >
          <Clock className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-indigo-400" />
          <span>
            {task.time ? task.time : "Без часу"} ({formatDuration(task.durationMinutes)})
          </span>
          <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        {activeMenu === "time" && (
          <div className="absolute left-0 mt-1.5 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-2.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
            {overdueByTime && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2 text-amber-200 text-[11px] space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Запізнюємося. Змінимо час?
                </div>
                <div className="flex gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setHours(now.getHours() + 1);
                      const h = String(now.getHours()).padStart(2, "0");
                      const m = String(now.getMinutes()).padStart(2, "0");
                      onUpdateTaskField(task.id, { time: `${h}:${m}` });
                      setActiveMenu(null);
                    }}
                    className="flex-1 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[10px] font-medium text-amber-200 text-center"
                  >
                    +1 год
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setHours(now.getHours() + 2);
                      const h = String(now.getHours()).padStart(2, "0");
                      const m = String(now.getMinutes()).padStart(2, "0");
                      onUpdateTaskField(task.id, { time: `${h}:${m}` });
                      setActiveMenu(null);
                    }}
                    className="flex-1 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[10px] font-medium text-amber-200 text-center"
                  >
                    +2 год
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTaskField(task.id, { time: null });
                      setActiveMenu(null);
                    }}
                    className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[10px] text-slate-300 text-center"
                  >
                    Без часу
                  </button>
                </div>
              </div>
            )}
            {/* Duration choices */}
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1.5 tracking-wider">
                Тривалість
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      onUpdateTaskField(task.id, { durationMinutes: mins });
                    }}
                    className={`py-1 rounded-md border text-center transition-all ${
                      task.durationMinutes === mins
                        ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {mins < 60 ? `${mins}хв` : `${mins / 60}г`}
                  </button>
                ))}
              </div>
            </div>

            {/* Time choices */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-1 mb-1.5 tracking-wider">
                Час початку
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {["09:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map((tStr) => (
                  <button
                    key={tStr}
                    type="button"
                    onClick={() => {
                      onUpdateTaskField(task.id, { time: tStr });
                      setActiveMenu(null);
                    }}
                    className={`py-1 px-1.5 rounded-md border text-center transition-all ${
                      task.time === tStr
                        ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                    }`}
                  >
                    {tStr}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="time"
                  value={task.time || ""}
                  onChange={(e) => {
                    onUpdateTaskField(task.id, { time: e.target.value || null });
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs flex-1 [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateTaskField(task.id, { time: null });
                    setActiveMenu(null);
                  }}
                  className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-md border border-slate-700"
                >
                  Очистити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. ENERGY LEVEL BADGE */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => toggleMenu("energy")}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer group ${getEnergyBadgeClass(
            task.energyLevel || "Medium"
          )}`}
          title="Швидка зміна рівня фокусу/енергії"
        >
          <Zap className="w-3 h-3 shrink-0" />
          <span>{getEnergyLabel(task.energyLevel || "Medium")}</span>
          <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        {activeMenu === "energy" && (
          <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-800">
              Рівень фокусу / енергії
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdateTaskField(task.id, { energyLevel: "High" });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-500/20 text-purple-300 font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Високий фокус
              </span>
              {task.energyLevel === "High" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateTaskField(task.id, { energyLevel: "Medium" });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-blue-500/20 text-blue-300 font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                Стандартний
              </span>
              {task.energyLevel === "Medium" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdateTaskField(task.id, { energyLevel: "Low" });
                setActiveMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-emerald-500/20 text-emerald-300 font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Легка рутина
              </span>
              {task.energyLevel === "Low" && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 5. CATEGORY BADGE */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => toggleMenu("category")}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer group"
          title="Швидка зміна категорії"
        >
          <Tag className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{task.category || "Без категорії"}</span>
          <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>

        {activeMenu === "category" && (
          <div className="absolute left-0 mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-800">
              Категорія
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onUpdateTaskField(task.id, { category: cat });
                  setActiveMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-200 flex items-center justify-between"
              >
                <span>{cat}</span>
                {task.category === cat && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            ))}

            <div className="pt-1.5 border-t border-slate-800 px-1">
              {!isEditingCategoryInput ? (
                <button
                  type="button"
                  onClick={() => setIsEditingCategoryInput(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium py-1 w-full text-left"
                >
                  + Власна категорія
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Категорія..."
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCategory.trim()) {
                        onUpdateTaskField(task.id, { category: customCategory.trim() });
                      }
                      setActiveMenu(null);
                      setIsEditingCategoryInput(false);
                    }}
                    className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Non-interactive text notice when task time is overdue */}
      {overdueByTime && (
        <div className="w-full text-[11px] text-amber-400/90 font-normal flex items-center gap-1.5 pt-0.5 select-none">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Запізнюємося за розкладом</span>
        </div>
      )}
    </div>
  );
};
