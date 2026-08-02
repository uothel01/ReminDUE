
export function parseDate(dateStr) {
  const [y,m,d] = dateStr.split("-").map(Number);
  return new Date(y, m-1, d);
}

export function toDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

export function daysFromToday(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = parseDate(dateStr);
  due.setHours(0,0,0,0);
  return Math.round((due - today) / 86400000);
}

export function addRepeat(dateStr, repeat) {
  const d = parseDate(dateStr);
  if (repeat === "weekly") d.setDate(d.getDate()+7);
  if (repeat === "monthly") d.setMonth(d.getMonth()+1);
  if (repeat === "quarterly") d.setMonth(d.getMonth()+3);
  if (repeat === "halfyearly") d.setMonth(d.getMonth()+6);
  if (repeat === "yearly") d.setFullYear(d.getFullYear()+1);
  return toDateInput(d);
}

export function formatDate(dateStr, options={day:"numeric",month:"short",year:"numeric"}) {
  return parseDate(dateStr).toLocaleDateString(undefined, options);
}

export function dueText(dateStr) {
  const days = daysFromToday(dateStr);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days)===1?"":"s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
