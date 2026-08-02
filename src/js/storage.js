
const STORAGE_KEY = "remindue.items.v1";

export function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function exportBackup(items) {
  const payload = {
    app: "ReminDUE",
    version: 1,
    exportedAt: new Date().toISOString(),
    items
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  downloadBlob(blob, `ReminDUE-backup-${new Date().toISOString().slice(0,10)}.json`);
}

export function exportCsv(items) {
  const headers = ["Title","Type","Category","Due Date","Amount","Repeat","Reminder Days","Status","Notes"];
  const rows = items.map(i => [
    i.title, i.type, i.category || "", i.dueDate, i.amount || "", i.repeat,
    i.reminderDays, i.status, (i.notes || "").replace(/\n/g, " ")
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], {type:"text/csv;charset=utf-8"}), `ReminDUE-${new Date().toISOString().slice(0,10)}.csv`);
}

export async function importBackup(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) throw new Error("Invalid backup file.");
  saveItems(items);
  return items;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
