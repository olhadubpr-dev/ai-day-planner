import React, { useState } from "react";
import { X, Plus, Trash2, Save, Clock, Tag, Zap, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Task, Priority, EnergyLevel } from "../types";
import { getDeadlineBadge, formatDuration } from "../lib/taskSorter";

interface TaskEditModalProps {
  task: Task;
  onSave: (updatedTask: Task) => void;
  onClose: () => void;
}

const timePresets = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const durationPresets = [15, 30, 45, 60, 90, 120, 180, 240];

const categoryPresets = [
  "Загальні",
  "Робота",
  "Особисте",
  "Здоров'я",
  "Навчання",
  "Фінанси",
  "Дім",
  "Спорт",
  "Творчість",
];

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ task, onSave, onClose }) => {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority || "Medium");
  const [time, setTime] = useState(task.time || "");

  const initialTotalMins = task.durationMinutes || 30;
  const initialHours = Math.floor(initialTotalMins / 60);
  const initialMins = initialTotalMins % 60;

  const [durationHours, setDurationHours] = useState<string>(
    initialHours > 0 ? String(initialHours) : ""
  );
  const [durationMins, setDurationMins] = useState<string>(
    initialMins > 0 ? String(initialMins) : ""
  );

  const parsedHours = parseInt(durationHours, 10) || 0;
  const parsedMins = parseInt(durationMins, 10) || 0;
  const calculatedDurationMinutes = parsedHours * 60 + parsedMins;

  const handleDurationPresetChange = (presetValue: string) => {
    if (presetValue === "custom") return;
    const totalMins = Number(presetValue);
    if (!isNaN(totalMins) && totalMins > 0) {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      setDurationHours(h > 0 ? String(h) : "");
      setDurationMins(m > 0 ? String(m) : "");
    }
  };

  const [category, setCategory] = useState(task.category || "Загальні");
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(task.energyLevel || "Medium");
  const [deadline, setDeadline] = useState<string>(
    task.deadline || ""
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
      durationMinutes: calculatedDurationMinutes > 0 ? calculatedDurationMinutes : 30,
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
                <option value="High">Високий</option>
                <option value="Medium">Середній</option>
                <option value="Low">Низький</option>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Time */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium text-xs flex items-center justify-between">
                <span>Час</span>
                <span className="text-[10px] text-slate-500">обрати / вписати</span>
              </label>
              <div className="space-y-1.5">
                <select
                  value={timePresets.includes(time) ? time : time ? "custom" : ""}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setTime(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Без часу --</option>
                  <option value="08:00">08:00 (Ранок)</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="12:00">12:00 (Обід)</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                  <option value="18:00">18:00 (Вечір)</option>
                  <option value="19:00">19:00</option>
                  <option value="20:00">20:00</option>
                  <option value="21:00">21:00</option>
                  <option value="custom">✏️ Власний час...</option>
                </select>
                <input
                  type="text"
                  placeholder="або впишіть (10:30)..."
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium text-xs flex items-center justify-between">
                <span>Тривалість</span>
                <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  {calculatedDurationMinutes > 0 ? formatDuration(calculatedDurationMinutes) : "30 хв"}
                </span>
              </label>
              <div className="space-y-1.5">
                <select
                  value={durationPresets.includes(calculatedDurationMinutes) ? String(calculatedDurationMinutes) : "custom"}
                  onChange={(e) => handleDurationPresetChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="15">15 хвилин</option>
                  <option value="30">30 хвилин (Стандарт)</option>
                  <option value="45">45 хвилин (Фокус)</option>
                  <option value="60">1 година (60 хв)</option>
                  <option value="90">1.5 години (90 хв)</option>
                  <option value="120">2 години (120 хв)</option>
                  <option value="180">3 години (180 хв)</option>
                  <option value="240">4 години (240 хв)</option>
                  <option value="300">5 годин (300 хв)</option>
                  <option value="custom">✏️ Власна тривалість (год + хв)...</option>
                </select>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={durationHours}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
                        setDurationHours(clean);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs pr-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none font-medium">
                      год
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={durationMins}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, "").replace(/^0+/, "");
                        const num = parseInt(clean, 10);
                        if (!isNaN(num) && num >= 60) {
                          const extraHours = Math.floor(num / 60);
                          const remMins = num % 60;
                          const curH = parseInt(durationHours, 10) || 0;
                          setDurationHours(String(curH + extraHours));
                          setDurationMins(remMins > 0 ? String(remMins) : "");
                        } else {
                          setDurationMins(clean);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs pr-7 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none font-medium">
                      хв
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium text-xs flex items-center justify-between">
                <span>Категорія</span>
                <span className="text-[10px] text-slate-500">обрати / вписати</span>
              </label>
              <div className="space-y-1.5">
                <select
                  value={categoryPresets.includes(category) ? category : category ? "custom" : "Загальні"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="Загальні">Загальні</option>
                  <option value="Робота">💼 Робота</option>
                  <option value="Особисте">👤 Особисте</option>
                  <option value="Здоров'я">🍏 Здоров'я</option>
                  <option value="Навчання">📚 Навчання</option>
                  <option value="Фінанси">💳 Фінанси</option>
                  <option value="Дім">🏠 Дім</option>
                  <option value="Спорт">⚽ Спорт</option>
                  <option value="Творчість">🎨 Творчість</option>
                  <option value="custom">✏️ Власна категорія...</option>
                </select>
                <input
                  type="text"
                  placeholder="або впишіть..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Deadline / Date Selection with Interactive Calendar Popup */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 font-medium block text-xs">Дата виконання (Заплановано на)</label>
              <span className={`text-xs px-2.5 py-0.5 rounded-md border ${getDeadlineBadge(deadline || undefined).color}`}>
                {getDeadlineBadge(deadline || undefined).label}
              </span>
            </div>

            <div className="flex gap-1.5 items-center flex-wrap sm:flex-nowrap">
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
                className={`px-2.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
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
                className={`px-2.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  deadline === (() => { const tom = new Date(); tom.setDate(tom.getDate() + 1); return tom.toISOString().split("T")[0]; })()
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                Завтра
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeadline("");
                  setShowCalendar(false);
                }}
                className={`px-2.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                  !deadline
                    ? "bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
                title="Очистити дату (перенести в 'Оберіть дату')"
              >
                Очистити
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
