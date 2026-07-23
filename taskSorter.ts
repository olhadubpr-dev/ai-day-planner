import React, { useState } from "react";
import { PenTool, Inbox, Calendar, CalendarDays, BarChart2, Sparkles, CheckCircle2, Wifi, RefreshCw, Key, Check } from "lucide-react";
import { ActiveTab } from "../types";

export const FlowLogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="flowGrad1" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
      <linearGradient id="flowGrad2" x1="2" y1="30" x2="30" y2="2" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A855F7" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    {/* Minimalist fluid stream ribbon representing 'Потік' / Flow */}
    <path
      d="M3 16C3 10 8 5 14 5C20 5 23 8.5 26 12C28.5 15 29.5 16 30.5 16"
      stroke="url(#flowGrad1)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <path
      d="M1.5 16C2.5 16 3.5 17 6 20C9 23.5 12 27 18 27C24 27 29 22 29 16"
      stroke="url(#flowGrad2)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <circle cx="16" cy="16" r="2.5" fill="url(#flowGrad1)" />
  </svg>
);

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  inboxCount: number;
  todayPendingCount: number;
  todayCompletedCount: number;
  syncStatus: "synced" | "syncing" | "offline";
  syncKey: string;
  onChangeSyncKey: (newKey: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  inboxCount,
  todayPendingCount,
  todayCompletedCount,
  syncStatus,
  syncKey,
  onChangeSyncKey,
}) => {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [inputKey, setInputKey] = useState(syncKey);
  const [copied, setCopied] = useState(false);

  const handleSaveKey = () => {
    if (inputKey.trim()) {
      onChangeSyncKey(inputKey.trim());
      setShowSyncModal(false);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    {
      id: "capture" as ActiveTab,
      label: "Потік",
      icon: PenTool,
      badge: null,
    },
    {
      id: "inbox" as ActiveTab,
      label: "Завдання",
      icon: Inbox,
      badge: inboxCount > 0 ? inboxCount : null,
    },
    {
      id: "today" as ActiveTab,
      label: "Сьогодні",
      icon: Calendar,
      badge: todayPendingCount > 0 ? todayPendingCount : null,
    },
    {
      id: "week" as ActiveTab,
      label: "Тиждень",
      icon: CalendarDays,
      badge: null,
    },
    {
      id: "analytics" as ActiveTab,
      label: "Прогрес",
      icon: BarChart2,
      badge: null,
    },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 shadow-md shadow-indigo-500/10">
              <FlowLogoIcon className="w-full h-full" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-none flex items-center gap-2">
                Potik
                <span className="text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                  AI Planner
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Будьте в потоці, рухайтеся по плану</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {/* Sync Badge Button */}
            <button
              onClick={() => {
                setInputKey(syncKey);
                setShowSyncModal(true);
              }}
              className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-300 transition-colors"
              title="Налаштування синхронізації пристроїв"
            >
              {syncStatus === "syncing" ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : syncStatus === "synced" ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden xs:inline">
                {syncStatus === "syncing" ? "Синхронізація..." : "Синхронізовано"}
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сьогодні: <strong className="text-white">{todayCompletedCount}</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Синхронізація пристроїв</h2>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Ваші завдання автоматично зберігаються в хмарі Firestore. Щоб синхронізувати телефон і комп’ютер, переконайся, що на обох пристроях вказано однакову <strong>Ключ-код синхронізації</strong>.
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Поточний ключ синхронізації:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Наприклад: my-secret-tasks"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : "Копіювати"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white"
              >
                Скасувати
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                Зберегти та завантажити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Fixed Navigation for Mobile/Desktop Navigation */}
      <nav aria-label="Головна навігація" className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 z-30 py-2 px-3">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center py-1 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-indigo-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                  {item.badge !== null && (
                    <span className="absolute -top-1.5 -right-2.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-500 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

