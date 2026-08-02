
import { daysFromToday } from "./dates.js";

export async function requestNotifications() {
  if (!("Notification" in window)) {
    alert("Notifications are not supported by this browser.");
    return false;
  }
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function checkAndNotify(items) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const todayKey = new Date().toISOString().slice(0,10);
  const notifiedKey = `remindue.notified.${todayKey}`;
  const notified = new Set(JSON.parse(localStorage.getItem(notifiedKey) || "[]"));

  items.filter(i => i.status !== "completed").forEach(item => {
    const days = daysFromToday(item.dueDate);
    const threshold = Number(item.reminderDays || 0);
    if (days <= threshold && !notified.has(item.id)) {
      const message = days < 0
        ? `${item.title} is ${Math.abs(days)} day${Math.abs(days)===1?"":"s"} overdue.`
        : days === 0
          ? `${item.title} is due today.`
          : `${item.title} is due in ${days} days.`;
      new Notification("ReminDUE", {
        body: message,
        icon: "./assets/icons/icon-192.png",
        badge: "./assets/icons/icon-192.png",
        tag: item.id
      });
      notified.add(item.id);
    }
  });

  localStorage.setItem(notifiedKey, JSON.stringify([...notified]));
}
