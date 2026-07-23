import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { CaptureScreen } from "./components/CaptureScreen";
import { InboxScreen } from "./components/InboxScreen";
import { TodayScreen } from "./components/TodayScreen";
import { WeekScreen } from "./components/WeekScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { TaskEditModal } from "./components/TaskEditModal";
import { Task, ActiveTab } from "./types";
import { subscribeToSync, saveToCloud } from "./lib/firebase";

const LOCAL_STORAGE_KEY_TASKS_V4 = "ai_planner_tasks_v4";
const LOCAL_STORAGE_KEY_INBOX = "ai_planner_inbox_v2";
const LOCAL_STORAGE_KEY_TODAY = "ai_planner_today_v2";
const LOCAL_STORAGE_KEY_SYNC_KEY = "ai_planner_sync_key_v1";
const DEFAULT_SYNC_KEY = "potik_shared_planner";

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
    id: "demo-overdue-1",
    title: "Занести бабусі ключі та забрати документи",
    priority: "High",
    time: "14:00",
    durationMinutes: 30,
    category: "Особисте",
    energyLevel: "Medium",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split("T")[0];
    })(),
    createdAt: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    })(),
    subtasks: [],
    completed: false,
    isCarriedOver: true,
  },
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
    title: "Вечірнє тренування або прогулянка 30 хв",
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
  
  const [syncKey, setSyncKey] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_SYNC_KEY) || DEFAULT_SYNC_KEY;
  });

  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("syncing");

  // Single source of truth for all tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedV4 = localStorage.getItem(LOCAL_STORAGE_KEY_TASKS_V4);
    if (savedV4) {
      try {
        return JSON.parse(savedV4);
      } catch (e) {
        console.error("Error parsing tasks v4:", e);
      }
    }

    const savedInbox = localStorage.getItem(LOCAL_STORAGE_KEY_INBOX);
    const savedToday = localStorage.getItem(LOCAL_STORAGE_KEY_TODAY);
    if (savedInbox || savedToday) {
      const inboxArr: Task[] = savedInbox ? JSON.parse(savedInbox) : [];
      const todayArr: Task[] = savedToday ? JSON.parse(savedToday) : [];
      const map = new Map<string, Task>();
      [...inboxArr, ...todayArr].forEach((t) => map.set(t.id, t));
      return Array.from(map.values());
    }

    const map = new Map<string, Task>();
    [...initialInboxDemo, ...initialTodayDemo].forEach((t) => map.set(t.id, t));
    return Array.from(map.values());
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const isRemoteUpdateRef = useRef(false);

  // Subscribe to Firestore Realtime updates
  useEffect(() => {
    setSyncStatus("syncing");
    const unsubscribe = subscribeToSync(
      syncKey,
      (data) => {
        isRemoteUpdateRef.current = true;
        const remoteList: Task[] = [];
        if (data.inboxTasks && Array.isArray(data.inboxTasks)) remoteList.push(...data.inboxTasks);
        if (data.todayTasks && Array.isArray(data.todayTasks)) remoteList.push(...data.todayTasks);
        if ((data as any).tasks && Array.isArray((data as any).tasks)) remoteList.push(...(data as any).tasks);

        if (remoteList.length > 0) {
          const map = new Map<string, Task>();
          remoteList.forEach((t) => map.set(t.id, t));
          setTasks(Array.from(map.values()));
        }
        setSyncStatus("synced");
      },
      (err) => {
        console.error("Cloud sync subscription error:", err);
        setSyncStatus("offline");
      }
    );

    return () => unsubscribe();
  }, [syncKey]);

  // Sync state changes to LocalStorage and Firebase Cloud
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TASKS_V4, JSON.stringify(tasks));

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    setSyncStatus("syncing");
    saveToCloud(syncKey, tasks, tasks)
      .then(() => setSyncStatus("synced"))
      .catch(() => setSyncStatus("offline"));
  }, [tasks, syncKey]);

  // Handle key change
  const handleChangeSyncKey = (newKey: string) => {
    setSyncKey(newKey);
    localStorage.setItem(LOCAL_STORAGE_KEY_SYNC_KEY, newKey);
  };

  // Handle tasks parsed from Capture
  const handleTasksParsed = (newTasks: Task[]) => {
    setTasks((prev) => {
      const map = new Map<string, Task>();
      prev.forEach((t) => map.set(t.id, t));
      newTasks.forEach((t) => map.set(t.id, t));
      return Array.from(map.values());
    });
  };

  // Move single task to Today
  const handleMoveToToday = (taskId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, deadline: todayStr } : t))
    );
  };

  // Move single task to Tomorrow
  const handleMoveToTomorrow = (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, deadline: tomorrowStr } : t))
    );
  };

  // Move ALL tasks to Today
  const handleMoveAllToToday = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setTasks((prev) => prev.map((t) => ({ ...t, deadline: todayStr })));
  };

  // Move task back to Inbox (remove deadline)
  const handleMoveToInbox = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, deadline: undefined } : t))
    );
  };

  // Toggle complete state
  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  // Toggle subtask
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
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
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Add new task manually
  const handleAddNewManualTask = () => {
    const newTask: Task = {
      id: `manual-${Date.now()}`,
      title: "",
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
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === updatedTask.id);
      if (exists) {
        return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      } else {
        return [updatedTask, ...prev];
      }
    });
    setEditingTask(null);
  };

  // Direct quick field update handler
  const handleUpdateTaskField = (taskId: string, fields: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...fields } : t))
    );
  };

  // AI Re-plan
  const handleReplanDay = async (userPrompt: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOnly = tasks.filter((t) => t.deadline && t.deadline <= todayStr);
    try {
      const res = await fetch("/api/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: todayOnly, userPrompt }),
      });
      const data = await res.json();
      if (data.reorderedTasks && Array.isArray(data.reorderedTasks)) {
        setTasks((prev) => {
          const reorderedMap = new Map<string, Task>();
          data.reorderedTasks.forEach((r: any) => {
            const original = prev.find((t) => t.id === r.id);
            reorderedMap.set(r.id, {
              ...(original || r),
              ...r,
              subtasks: original?.subtasks || [],
            });
          });
          return prev.map((t) => reorderedMap.get(t.id) || t);
        });
      }
    } catch (err) {
      console.error("Error replanning:", err);
    }
  };

  // Clear All
  const handleClearAll = () => {
    setTasks([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TASKS_V4);
    localStorage.removeItem(LOCAL_STORAGE_KEY_INBOX);
    localStorage.removeItem(LOCAL_STORAGE_KEY_TODAY);
  };

  const [currentTodayStr, setCurrentTodayStr] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  // Synchronize system date automatically so day transitions or long sessions keep all tasks and badges up to date
  useEffect(() => {
    const interval = setInterval(() => {
      const nowStr = new Date().toISOString().split("T")[0];
      if (nowStr !== currentTodayStr) {
        setCurrentTodayStr(nowStr);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentTodayStr]);

  const todayStr = currentTodayStr;
  const isCarriedOverTask = (t: Task) => {
    if (t.completed) return false;
    if (t.isCarriedOver) return true;
    if (t.deadline && t.deadline < todayStr) return true;
    return false;
  };

  const strictlyTodayTasks = tasks.filter(
    (t) => Boolean(t.deadline) && (t.deadline! <= todayStr || isCarriedOverTask(t))
  );
  const todayPendingCount = strictlyTodayTasks.filter((t) => !t.completed).length;
  const todayCompletedCount = strictlyTodayTasks.filter((t) => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inboxCount={tasks.length}
        todayPendingCount={todayPendingCount}
        todayCompletedCount={todayCompletedCount}
        syncStatus={syncStatus}
        syncKey={syncKey}
        onChangeSyncKey={handleChangeSyncKey}
      />

      <main className="flex-1 p-4 md:p-8">
        {activeTab === "capture" && (
          <CaptureScreen
            onTasksParsed={handleTasksParsed}
            onNavigateToInbox={() => setActiveTab("inbox")}
            onNavigateToToday={() => setActiveTab("today")}
            onNavigateToWeek={() => setActiveTab("week")}
          />
        )}

        {activeTab === "inbox" && (
          <InboxScreen
            inboxTasks={tasks}
            onToggleComplete={handleToggleComplete}
            onToggleSubtask={handleToggleSubtask}
            onMoveToToday={handleMoveToToday}
            onMoveToTomorrow={handleMoveToTomorrow}
            onMoveAllToToday={handleMoveAllToToday}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onUpdateTaskField={handleUpdateTaskField}
            onAddNewManualTask={handleAddNewManualTask}
            onNavigateToCapture={() => setActiveTab("capture")}
          />
        )}

        {activeTab === "today" && (
          <TodayScreen
            todayTasks={tasks}
            onToggleComplete={handleToggleComplete}
            onToggleSubtask={handleToggleSubtask}
            onMoveToInbox={handleMoveToInbox}
            onDeleteTask={handleDeleteTask}
            onEditTask={(task) => setEditingTask(task)}
            onUpdateTaskField={handleUpdateTaskField}
            onReplanDay={handleReplanDay}
            onNavigateToCapture={() => setActiveTab("capture")}
          />
        )}

        {activeTab === "week" && (
          <WeekScreen
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEditTask={(task) => setEditingTask(task)}
            onAddNewTaskWithDeadline={handleAddNewTaskWithDeadline}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsScreen
            tasks={tasks}
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
