import React from "react";
import { PenTool, Inbox, Calendar, CalendarDays, BarChart2, Sparkles, CheckCircle2 } from "lucide-react";
import { ActiveTab } from "../types";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  inboxCount: number;
  todayPendingCount: number;
  todayCompletedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  inboxCount,
  todayPendingCount,
  todayCompletedCount,
}) => {
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
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

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сьогодні: <strong className="text-white">{todayCompletedCount}</strong> виконано</span>
            </div>
          </div>
        </div>
      </header>

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
