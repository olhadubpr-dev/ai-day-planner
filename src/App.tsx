import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { CaptureScreen } from "./components/CaptureScreen";
import { InboxScreen } from "./components/InboxScreen";
import { TodayScreen } from "./components/TodayScreen";
import { WeekScreen } from "./components/WeekScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { TaskEditModal } from "./components/TaskEditModal";
import { Task, ActiveTab } from "./types";

const LOCAL_STORAGE_KEY_INBOX = "ai_planner_inbox_v2";
const LOCAL_STORAGE_KEY_TODAY = "ai_planner_today_v2";

const initialInboxDemo: Task[] = [
  {
    id: "demo-1",
    title: "Надіслати підсумковий звіт з фінансів",
    priority: "High",
    time: "11:00",
    durationMinutes: 45,
    category: "Робота",
    energyLevel: "High",
    deadline: new Date().toISOString().split("T")[0],
    subtasks: [
      { id: "sub-d1", title: "Звести розрахунки в Excel", completed: true },
      { id: "sub-d2", title: "Надіслати листа керівнику", completed: false }
    ],
    completed: false
  },
  {
    id: "demo-2",
    title: "Замовити продукти на вечір",
    priority: "Low",
    time: null,
    durationMinutes: 15,
    category: "Дім",
    energyLevel: "Low",
    deadline: null,
    subtasks: [],
    completed: false
  }
];

const initialTodayDemo: Task[] = [
  {
    id: "demo-3",
    title: "Пройти воркшоп з AI Studio та Claude",
    priority: "High",
    time: "10:00",
    durationMinutes: 60,
    category: "Навчання",
    energyLevel: "High",
    deadline: new Date().toISOString().split("T")[0],
    subtasks: [
      { id: "sub-d3", title: "Запустити AI Day Planner", completed: true },
      { id: "sub-d4", title: "Записати демо Loom", completed: false }
    ],
    completed: false
  },
  {
    id: "demo-4",
    title: "Вечірне тренування або прогулянка 30 хв",
    priority: "Medium",
    time: "19:00",
    durationMinutes: 40,
    category: "Здоров'я",
    energyLevel: "Medium",
    deadline: new Date().toISOString().split("T")[0],
    subtasks: [],
    completed: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [inboxTasks, setInboxTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_INBOX);
    return saved ? JSON.parse(saved) : initialInboxDemo;
  });

  const [todayTasks, setTodayTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TODAY);
    return saved ? JSON.parse(saved) : initialTodayDemo;
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_INBOX, JSON.stringify(inboxTasks));
  }, [inboxTasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TODAY, JSON.stringify(todayTasks));
  }, [todayTasks]);

  // Handle tasks parsed from Capture
  const handleTasksParsed = (newTasks: Task[]) => {
    setInboxTasks((prev) => [...prev, ...newTasks]);
  };

  // Move single task from Inbox to Today
  const handleMoveToToday = (taskId: string) => {
    const task = inboxTasks.find((t) => t.id === taskId);
    if (!task) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const updatedTask = { ...task, deadline: todayStr };

    setInboxTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTodayTasks((prev) => [...prev, updatedTask]);
  };

  // Move single task from Inbox to Tomorrow
  const handleMoveToTomorrow = (taskId: string) => {
    const task = inboxTasks.find((t) => t.id === taskId);
    if (!task) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const updatedTask = { ...task, deadline: tomorrowStr };

    setInboxTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTodayTasks((prev) => [...prev, updatedTask]);
  };

  // Move ALL tasks from Inbox to Today
  const handleMoveAllToToday = () => {
    setTodayTasks((prev) => [...prev, ...inboxTasks]);
    setInboxTasks([]);
  };

  // Move task from Today back to Inbox
  const handleMoveToInbox = (taskId: string) => {
    const task = todayTasks.find((t) => t.id === taskId);
    if (!task) return;

    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
    setInboxTasks((prev) => [...prev, task]);
  };

  // Toggle complete state in Today
  const handleToggleComplete = (taskId: string) => {
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    // Also check in inbox if toggled from week view
    setInboxTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Toggle subtask
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTodayTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSub = (t.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: updatedSub };
      })
    );
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setInboxTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTodayTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Add new task manually
  const handleAddNewManualTask = () => {
    const newTask: Task = {
      id: `manual-${Date.now()}`,
      title: "Нова задача",
      priority: "Medium",
      time: "12:00",
      durationMinutes: 30,
      category: "Загальні",
      energyLevel: "Medium",
      deadline: new Date().toISOString().split("T")[0],
      subtasks: [],
      completed: false,
    };
    setEditingTask(newTask);
  };

  // Add new task manually with specific deadline
  const handleAddNewTaskWithDeadline = (deadlineDate: string) => {
    const newTask: Task = {
      id: `manual-${Date.now()}`,
      title: "",
      priority: "Medium",
      time: "12:00",
      durationMinutes: 30,
      category: "Загальні",
      energyLevel: "Medium",
      deadline: deadlineDate,
      subtasks: [],
      completed: false,
    };
    setEditingTask(newTask);
  };

  // Save edited task
  const handleSaveEditedTask = (updatedTask: Task) => {
    const inInbox = inboxTasks.some((t) => t.id === updatedTask.id);
    const inToday = todayTasks.some((t) => t.id === updatedTask.id);

    if (inInbox) {
      setInboxTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    } else if (inToday) {
      setTodayTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    } else {
      // New manual task -> push to Inbox
      setInboxTasks((prev) => [updatedTask, ...prev]);
    }
    setEditingTask(null);
  };

  // AI Re-plan
  const handleReplanDay = async (userPrompt: string) => {
    try {
      const res = await fetch("/api/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: todayTasks, userPrompt }),
      });
      const data = await res.json();
      if (data.reorderedTasks && Array.isArray(data.reorderedTasks)) {
        // Merge reordered tasks back keeping subtasks
        const merged = data.reorderedTasks.map((reordered: any) => {
          const original = todayTasks.find((t) => t.id === reordered.id);
          return {
            ...(original || reordered),
            ...reordered,
            subtasks: original?.subtasks || []
          };
        });
        setTodayTasks(merged);
      }
    } catch (err) {
      console.error("Error replanning:", err);
    }
  };

  // Clear All
  const handleClearAll = () => {
    setInboxTasks([]);
    setTodayTasks([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_INBOX);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TODAY);
  };

  const todayPendingCount = todayTasks.filter((t) => !t.completed).length;
  const todayCompletedCount = todayTasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inboxCount={inboxTasks.length}
        todayPendingCount={todayPendingCount}
        todayCompletedCount={todayCompletedCount}
      />

      <main className="flex-1 p-4 md:p-8">
        {activeTab === "capture" && (
          <CaptureScreen
            onTasksParsed={handleTasksParsed}
            onNavigateToInbox={() => setActiveTab("inbox")}
          />
        )}

        {activeTab === "inbox" && (
          <InboxScreen
            inboxTasks={inboxTasks}
            onMoveToToday={handleMoveToToday}
            onMoveToTomorrow={handleMoveToTomorrow}
            onMoveAllToToday={handleMoveAllToToday}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onAddNewManualTask={handleAddNewManualTask}
            onNavigateToCapture={() => setActiveTab("capture")}
          />
        )}

        {activeTab === "today" && (
          <TodayScreen
            todayTasks={todayTasks}
            onToggleComplete={handleToggleComplete}
            onToggleSubtask={handleToggleSubtask}
            onMoveToInbox={handleMoveToInbox}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onReplanDay={handleReplanDay}
            onNavigateToCapture={() => setActiveTab("capture")}
          />
        )}

        {activeTab === "week" && (
          <WeekScreen
            tasks={[...todayTasks, ...inboxTasks]}
            onToggleComplete={handleToggleComplete}
            onEditTask={(task) => setEditingTask(task)}
            onAddNewTaskWithDeadline={handleAddNewTaskWithDeadline}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsScreen
            tasks={[...todayTasks, ...inboxTasks]}
            onClearAll={handleClearAll}
          />
        )}
      </main>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onSave={handleSaveEditedTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
