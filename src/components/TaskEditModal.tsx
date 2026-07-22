import React, { useState } from "react";
import { X, Plus, Trash2, Save, Clock, Tag, Zap, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Task, Priority, EnergyLevel } from "../types";

interface TaskEditModalProps {
  task: Task;
  onSave: (updatedTask: Task) => void;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onSave, onClose }) => {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority || "Medium");
  const [time, setTime] = useState(task.time || "");
  const [durationMinutes, setDurationMinutes] = useState(task.durationMinutes || 30);
  const [category, setCategory] = useState(task.category || "Загальні");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(task.energyLevel || "Medium");
  const [deadline, setDeadline] = useState<string>(
    task.deadline || new Date().toISOString().split("T")[0]
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const initialDate = task.deadline ? new Date(task.deadline + "T00:00:00") : new Date();
  const [calYear, setCalYear] = useState(isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear());
  const [calMonth, setCalMonth] = useState(isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth());
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      ...task,
      title: title.trim(),
      priority,
      time: time.trim() || null,
      durationMinutes: Number(durationMinutes) || 30,
      category: category.trim() || "Загальні",
      energyLevel,
      deadline: deadline || null,
      subtasks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base">Редагування задачі</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Назва задачі</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Пріоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="High">Високий (High)</option>
                <option value="Medium">Середній (Medium)</option>
                <option value="Low">Низький (Low)</option>
              </select>
            </div>

            {/* Energy Level */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Рівень енергії</label>
              <select
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value as EnergyLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="High">Високий фокус</option>
                <option value="Medium">Стандартний</option>
                <option value="Low">Легка рутина</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Time */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Час (напр. 10:30)</label>
              <input
                type="text"
                placeholder="HH:MM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Тривалість (хв)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Категорія</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Deadline / Date Selection with Interactive Calendar Popup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-medium block">Дата виконання (Заплановано на)</label>
              {deadline && (
                <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                  {(() => {
                    try {
                      const d = new Date(deadline + "T00:00:00");
                      const dayName = d.toLocaleDateString("uk-UA", { weekday: "long" });
                      const formattedDate = d.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
                      const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                      return `${capDay}, ${formattedDate}`;
                    } catch {
                      return deadline;
                    }
                  })()}
                </span>
              )}
            </div>

            <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex-1 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-2.5 text-left text-slate-100 font-medium text-xs flex items-center justify-between gap-2 transition-all"
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{deadline ? deadline : "Оберіть дату..."}</span>
                </div>
                <span className="text-[11px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {showCalendar ? "Сховати" : "Календар 📅"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().split("T")[0];
                  setDeadline(todayStr);
                  setShowCalendar(false);
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  deadline === new Date().toISOString().split("T")[0]
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                Сьогодні
              </button>

              <button
                type="button"
                onClick={() => {
                  const tom = new Date();
                  tom.setDate(tom.getDate() + 1);
                  const tomStr = tom.toISOString().split("T")[0];
                  setDeadline(tomStr);
                  setShowCalendar(false);
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  deadline === (() => { const tom = new Date(); tom.setDate(tom.getDate() + 1); return tom.toISOString().split("T")[0]; })()
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                Завтра
              </button>
            </div>

            {/* Interactive Calendar Dropdown Grid */}
            {showCalendar && (
              <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-xl animate-fadeIn">
                {/* Month/Year Header */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear(calYear - 1);
                      } else {
                        setCalMonth(calMonth - 1);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-bold text-slate-200 text-xs">
                    {["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"][calMonth]} {calYear}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear(calYear + 1);
                      } else {
                        setCalMonth(calMonth + 1);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1.5">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const firstDay = new Date(calYear, calMonth, 1);
                    // Monday as 0: (getDay() + 6) % 7
                    const startOffset = (firstDay.getDay() + 6) % 7;
                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                    const daysArray = [];

                    // Blank cells before first day
                    for (let i = 0; i < startOffset; i++) {
                      daysArray.push(<div key={`blank-${i}`} />);
                    }

                    // Days of month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const mStr = String(calMonth + 1).padStart(2, "0");
                      const dStr = String(day).padStart(2, "0");
                      const dateIso = `${calYear}-${mStr}-${dStr}`;
                      const isSelected = deadline === dateIso;
                      const isToday = new Date().toISOString().split("T")[0] === dateIso;

                      daysArray.push(
                        <button
                          key={dateIso}
                          type="button"
                          onClick={() => {
                            setDeadline(dateIso);
                            setShowCalendar(false);
                          }}
                          className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105"
                              : isToday
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                    return daysArray;
                  })()}
                </div>

                {/* Direct Manual Date Input Fallback */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Вказати точну дату вручну:</span>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-1 px-2 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 [color-scheme:dark]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-slate-400 font-medium block">Підзадачі</label>
            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-200">{s.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(s.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Нова підзадача..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium"
              >
                + Додати
              </button>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Зберегти</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
