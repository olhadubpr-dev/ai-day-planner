import { Task } from "../types";

export const getEnergyLabel = (energy?: string | null): string => {
  if (!energy) return "";
  switch (energy) {
    case "High":
      return "Високий фокус";
    case "Medium":
      return "Стандартний";
    case "Low":
      return "Легка рутина";
    default:
      return energy;
  }
};

export const formatDuration = (totalMinutes: number | undefined | null): string => {
  if (totalMinutes === 0) return "0 хв";
  if (!totalMinutes || totalMinutes < 0) return "30 хв";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours} год ${mins} хв`;
  }
  if (hours > 0) {
    return `${hours} год`;
  }
  return `${mins} хв`;
};

export const isCarriedOverTask = (
  task: Task,
  todayStr: string = new Date().toISOString().split("T")[0]
): boolean => {
  if (task.completed) return false;
  if (task.isCarriedOver) return true;
  if (task.deadline && task.deadline.split("T")[0] < todayStr) return true;
  return false;
};

export const isTaskOverdueByTime = (
  task: Task,
  todayStr: string = new Date().toISOString().split("T")[0]
): boolean => {
  if (task.completed) return false;
  if (!task.time || !task.time.trim()) return false;

  const taskDl = task.deadline ? task.deadline.split("T")[0] : null;
  if (!taskDl) return false;

  if (taskDl < todayStr) return true;
  if (taskDl > todayStr) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const timeParts = task.time.split(":").map(Number);
  if (timeParts.length < 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) return false;

  const startMinutes = timeParts[0] * 60 + timeParts[1];
  const duration = task.durationMinutes || 30;
  const endMinutes = startMinutes + duration;

  return currentMinutes >= endMinutes;
};

export const getDeadlineBadge = (
  deadline: string | undefined,
  todayStr: string = new Date().toISOString().split("T")[0]
): { label: string; color: string } => {
  const neutralColor = "bg-slate-800 text-slate-300 border-slate-700/80 font-medium";

  if (!deadline || !deadline.trim()) {
    return {
      label: "Оберіть дату",
      color: neutralColor,
    };
  }

  const taskDl = deadline.split("T")[0];

  const todayParts = todayStr.split("-").map(Number);
  const todayObj = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);

  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomYear = tomorrowObj.getFullYear();
  const tomMonth = String(tomorrowObj.getMonth() + 1).padStart(2, "0");
  const tomDay = String(tomorrowObj.getDate()).padStart(2, "0");
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const dlParts = taskDl.split("-").map(Number);
  const dlDate = new Date(dlParts[0], dlParts[1] - 1, dlParts[2]);

  const daysOfWeek = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];
  const monthsGenitive = [
    "січня",
    "лютого",
    "березня",
    "квітня",
    "травня",
    "червня",
    "липня",
    "серпня",
    "вересня",
    "жовтня",
    "листопада",
    "грудня",
  ];

  const dayOfWeek = daysOfWeek[dlDate.getDay()];
  const dayNum = dlDate.getDate();
  const monthName = monthsGenitive[dlDate.getMonth()];

  if (taskDl < todayStr) {
    return {
      label: `Протерміновано (${dayOfWeek}, ${dayNum} ${monthName.slice(0, 4)}.)`,
      color: neutralColor,
    };
  }

  if (taskDl === todayStr) {
    return {
      label: `Сьогодні, ${dayOfWeek}, ${dayNum} ${monthName}`,
      color: neutralColor,
    };
  }

  if (taskDl === tomorrowStr) {
    return {
      label: `Завтра, ${dayOfWeek}, ${dayNum} ${monthName}`,
      color: neutralColor,
    };
  }

  return {
    label: `${dayOfWeek}, ${dayNum} ${monthName}`,
    color: neutralColor,
  };
};

export const sortTasks = (
  tasks: Task[],
  todayStr: string = new Date().toISOString().split("T")[0]
): Task[] => {
  return [...tasks].sort((a, b) => {
    // 0. Uncompleted before completed
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    const aCarried = isCarriedOverTask(a, todayStr);
    const bCarried = isCarriedOverTask(b, todayStr);

    // 1. Uncompleted Carried over tasks ("перенесені з минулого" / overdue) FIRST
    if (aCarried && !bCarried) return -1;
    if (!aCarried && bCarried) return 1;

    // 2. Tasks WITHOUT dates ("Оберіть дату") come NEXT (so fresh tasks needing details/dates are right at the top)
    const aHasDate = Boolean(a.deadline && a.deadline.trim());
    const bHasDate = Boolean(b.deadline && b.deadline.trim());

    if (!aHasDate && bHasDate) return -1;
    if (aHasDate && !bHasDate) return 1;

    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    const pA = priorityWeight[a.priority] || 2;
    const pB = priorityWeight[b.priority] || 2;

    // 3. IF BOTH HAVE DATES:
    if (aHasDate && bHasDate && a.deadline && b.deadline) {
      // 3a. Compare deadline date CHRONOLOGICALLY (Today < Tomorrow < Saturday, etc.)
      if (a.deadline !== b.deadline) {
        return a.deadline.localeCompare(b.deadline);
      }

      // 3b. If dates are identical: compare Priority (High > Medium > Low)
      if (pA !== pB) return pB - pA;

      // 3c. Compare time if present
      const aHasTime = Boolean(a.time && a.time.trim());
      const bHasTime = Boolean(b.time && b.time.trim());
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;
      if (aHasTime && bHasTime && a.time && b.time) {
        const timeCompare = a.time.localeCompare(b.time);
        if (timeCompare !== 0) return timeCompare;
      }

      // 3d. Duration descending (longer duration first)
      const durA = a.durationMinutes || 0;
      const durB = b.durationMinutes || 0;
      if (durA !== durB) return durB - durA;

      return 0;
    }

    // 4. IF BOTH DO NOT HAVE DATES:
    // First compare Priority (High > Medium > Low)
    if (pA !== pB) return pB - pA;

    // Next compare Duration (longer duration first)
    const durA = a.durationMinutes || 0;
    const durB = b.durationMinutes || 0;
    if (durA !== durB) return durB - durA;

    // Next compare time if present
    const aHasTime = Boolean(a.time && a.time.trim());
    const bHasTime = Boolean(b.time && b.time.trim());
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;
    if (aHasTime && bHasTime && a.time && b.time) {
      return a.time.localeCompare(b.time);
    }

    return 0;
  });
};
