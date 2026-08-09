
import { loadItems, saveItems, exportBackup, exportCsv, importBackup } from "./storage.js";
import { daysFromToday, addRepeat, formatDate, dueText, parseDate, toDateInput } from "./dates.js";
import { requestNotifications, checkAndNotify } from "./notifications.js";

let items = loadItems();
let calendarCursor = new Date();
calendarCursor.setDate(1);

const $ = id => document.getElementById(id);
const dialog = $("itemDialog");
const completionDialog = $("completionDialog");
const form = $("itemForm");

const iconMap = {
  payment: "₹",
  renewal: "↻",
  appointment: "🩺",
  maintenance: "🔧",
  reminder: "🔔"
};
const typeLabels = {payment:"Payment", renewal:"Renewal", appointment:"Appointment", maintenance:"Maintenance", reminder:"Reminder"};

function seedIfEmpty() {
  if (items.length) return;
  const today = new Date();
  const plus = n => {
    const d = new Date(today);
    d.setDate(d.getDate()+n);
    return toDateInput(d);
  };
  items = [
    {
      id: crypto.randomUUID(),
      title: "Electricity bill",
      type: "payment",
      category: "Utility",
      dueDate: plus(3),
      amount: "2450",
      repeat: "monthly",
      reminderDays: "3",
      notes: "",
      status: "upcoming",
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Vehicle insurance renewal",
      type: "renewal",
      category: "Insurance",
      dueDate: plus(28),
      amount: "",
      repeat: "yearly",
      reminderDays: "30",
      notes: "",
      status: "upcoming",
      createdAt: new Date().toISOString()
    }
  ];
  saveItems(items);
}

function statusFor(item) {
  if (item.status === "completed") return "completed";
  const d = daysFromToday(item.dueDate);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  return "upcoming";
}

function amountText(item) {
  if (!item.amount) return "";
  return `₹${Number(item.amount).toLocaleString("en-IN")}`;
}

function itemCard(item) {
  const status = statusFor(item); const meta=[amountText(item),formatDate(item.dueDate),dueText(item.dueDate)].filter(Boolean).join(" · ");
  const completedMeta=item.status==="completed"&&item.completedDate?`<br>Completed: ${formatDate(item.completedDate)}${item.completionNotes?" · "+escapeHtml(item.completionNotes):""}`:"";
  return `<article class="item-card ${status}"><div class="item-icon">${iconMap[item.type]||"•"}</div><div><div class="item-title">${escapeHtml(item.title)}</div><div class="item-meta">${escapeHtml(meta)}${item.category?`<br>${escapeHtml(item.category)}`:""}${completedMeta}</div></div><div class="item-actions">${item.status!=="completed"?`<button class="mini done" data-complete="${item.id}">${item.type==="payment"?"Mark paid":"Complete"}</button>`:""}<button class="mini" data-edit="${item.id}">Edit</button></div></article>`;
}

function renderHome() {
  $("todayLabel").textContent = new Date().toLocaleDateString(undefined, {weekday:"long", day:"numeric", month:"long"});
  const active = items.filter(i => i.status !== "completed");
  $("dueSoonCount").textContent = active.filter(i => {
    const d = daysFromToday(i.dueDate); return d >= 0 && d <= 7;
  }).length;
  $("overdueCount").textContent = active.filter(i => daysFromToday(i.dueDate) < 0).length;
  const now = new Date();
  $("monthCount").textContent = active.filter(i => {
    const d = parseDate(i.dueDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const sorted = [...active].sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const groups = [
    ["Overdue", sorted.filter(i => daysFromToday(i.dueDate) < 0)],
    ["Today", sorted.filter(i => daysFromToday(i.dueDate) === 0)],
    ["Upcoming", sorted.filter(i => daysFromToday(i.dueDate) > 0)]
  ];
  $("timeline").innerHTML = groups.map(([name, arr]) =>
    arr.length ? `<h3 class="group-title">${name}</h3>${arr.map(itemCard).join("")}` : ""
  ).join("") || `<div class="empty">No active items. Add your first reminder.</div>`;
}

function renderItems() {
  const q = $("searchInput").value.trim().toLowerCase();
  const filter = $("typeFilter").value;
  const filtered = [...items]
    .filter(i => filter === "all" || i.type === filter)
    .filter(i => `${i.title} ${i.category} ${i.notes}`.toLowerCase().includes(q))
    .sort((a,b) => a.dueDate.localeCompare(b.dueDate));

  $("allItems").innerHTML = filtered.length
    ? filtered.map(itemCard).join("")
    : `<div class="empty">No matching items.</div>`;
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  $("calendarTitle").textContent = calendarCursor.toLocaleDateString(undefined, {month:"long",year:"numeric"});

  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const today = new Date(); today.setHours(0,0,0,0);
  const names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(n => `<div class="day-name">${n}</div>`).join("");
  const days = [];

  for (let i=0;i<42;i++) {
    const d = new Date(start);
    d.setDate(start.getDate()+i);
    const key = toDateInput(d);
    const dayItems = items.filter(x => x.dueDate === key && x.status !== "completed");
    const isToday = d.getTime() === today.getTime();
    days.push(`
      <button type="button" class="calendar-day ${d.getMonth()!==month?"muted":""} ${isToday?"today":""}" data-calendar-date="${key}">
        <div>${d.getDate()}</div>
        <div class="dot-row">${dayItems.slice(0,5).map(x => `<span class="dot ${statusFor(x)==="overdue"?"overdue":""}"></span>`).join("")}</div>
      </div>
    `);
  }
  $("calendarGrid").innerHTML = names + days.join("");

  const agenda = items.filter(i => {
    const d = parseDate(i.dueDate);
    return d.getMonth() === month && d.getFullYear() === year;
  }).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  $("calendarAgenda").innerHTML = agenda.length
    ? `<h3 class="group-title">This month</h3>${agenda.map(itemCard).join("")}`
    : `<div class="empty">No items this month.</div>`;
}

function renderAll() {
  renderHome();
  renderItems();
  renderCalendar();
}

function renderCalendarAgenda(dateKey) { const agenda=items.filter(i=>i.dueDate===dateKey).sort((a,b)=>(a.status==="completed")-(b.status==="completed")); const title=`Items on ${formatDate(dateKey,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}`; $("calendarAgenda").innerHTML=agenda.length?`<h3 class="group-title">${title}</h3>${agenda.map(itemCard).join("")}`:`<div class="empty">${title}: no items.</div>`; }

function renderInsights() {
 const dim=$("insightDimension").value, period=$("insightPeriod").value; let data=items; if(period!=="all") data=data.filter(i=>Math.abs(daysFromToday(i.dueDate))<=Number(period));
 const active=data.filter(i=>i.status!=="completed").length, completed=data.filter(i=>i.status==="completed").length, overdue=data.filter(i=>i.status!=="completed"&&daysFromToday(i.dueDate)<0).length;
 $("insightSummary").innerHTML=`<div class="insight-kpi"><span>Total</span><strong>${data.length}</strong></div><div class="insight-kpi"><span>Upcoming</span><strong>${active}</strong></div><div class="insight-kpi"><span>Completed</span><strong>${completed}</strong></div><div class="insight-kpi danger-kpi"><span>Overdue</span><strong>${overdue}</strong></div>`;
 if(!data.length){$("insightReport").innerHTML=`<div class="empty">No data for this period.</div>`;return;}
 let groups={}; data.forEach(i=>{let k=dim==="type"?typeLabels[i.type]:dim==="category"?(i.category||"Uncategorised"):dim==="status"?(i.status==="completed"?"Completed / Paid":daysFromToday(i.dueDate)<0?"Overdue":"Upcoming / Active"):i.dueDate.slice(0,7); (groups[k]??=[]).push(i)});
 $("insightReport").innerHTML=Object.keys(groups).sort().map(k=>{let a=groups[k],c=a.filter(i=>i.status==="completed").length,o=a.filter(i=>i.status!=="completed"&&daysFromToday(i.dueDate)<0).length;return `<section class="report-group"><div class="report-head"><strong>${escapeHtml(k)}</strong><span>${a.length} item${a.length===1?"":"s"} · ${c} completed${o?` · ${o} overdue`:""}</span></div><div class="progress"><span style="width:${Math.round(c/a.length*100)}%"></span></div>${a.slice(0,5).map(i=>`<div class="report-row"><span>${escapeHtml(i.title)}</span><span>${formatDate(i.dueDate)}</span></div>`).join("")}</section>`}).join("");
}

function openAdd() {
  form.reset();
  $("dialogTitle").textContent = "Add item";
  $("itemId").value = "";
  $("dueDate").value = toDateInput(new Date());
  $("reminderDays").value = "7";
  $("deleteBtn").classList.add("hidden");
  dialog.showModal();
}

function openEdit(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  $("dialogTitle").textContent = "Edit item";
  $("itemId").value = item.id;
  $("title").value = item.title;
  $("type").value = item.type;
  $("category").value = item.category || "";
  $("dueDate").value = item.dueDate;
  $("amount").value = item.amount || "";
  $("repeat").value = item.repeat;
  $("reminderDays").value = item.reminderDays;
  $("notes").value = item.notes || "";
  $("deleteBtn").classList.remove("hidden");
  dialog.showModal();
}

function completeItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  if (item.repeat && item.repeat !== "none") {
    const completedCopy = {...item, id: crypto.randomUUID(), status:"completed", completedAt:new Date().toISOString()};
    item.dueDate = addRepeat(item.dueDate, item.repeat);
    item.status = "upcoming";
    items.push(completedCopy);
  } else {
    item.status = "completed";
    item.completedAt = new Date().toISOString();
  }
  saveItems(items);
  renderAll();
}

function openCompletion(id){ const item=items.find(i=>i.id===id); if(!item)return; $("completionItemId").value=id; $("completionTitle").textContent=item.type==="payment"?"Mark as paid":"Mark as completed"; $("completedDate").value=toDateInput(new Date()); $("completionNotes").value=""; completionDialog.showModal(); }


function escapeHtml(value="") {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const id = $("itemId").value;
  const item = {
    id: id || crypto.randomUUID(),
    title: $("title").value.trim(),
    type: $("type").value,
    category: $("category").value.trim(),
    dueDate: $("dueDate").value,
    amount: $("amount").value,
    repeat: $("repeat").value,
    reminderDays: $("reminderDays").value,
    notes: $("notes").value.trim(),
    status: id ? (items.find(i=>i.id===id)?.status || "upcoming") : "upcoming",
    createdAt: id ? (items.find(i=>i.id===id)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  if (id) { if (!confirm(`Update "${existing?.title || item.title}"?\n\nYour changes will be saved.`)) return; items = items.map(i => i.id === id ? item : i); }
  else items.push(item);

  saveItems(items);
  dialog.close();
  renderAll();
  checkAndNotify(items);
});

$("completionForm").addEventListener("submit", e=>{ e.preventDefault(); const date=$("completedDate").value, notes=$("completionNotes").value.trim(); if(!date||!notes){alert("Completion notes are mandatory.");return;} if(!confirm(`Confirm completion on ${formatDate(date)}?\n\nNotes: ${notes}`))return; completeItem($("completionItemId").value,date,notes); completionDialog.close(); });
$("closeCompletion").onclick=()=>completionDialog.close(); $("cancelCompletion").onclick=()=>completionDialog.close();
$("insightDimension").addEventListener("change",renderInsights); $("insightPeriod").addEventListener("change",renderInsights);
const FEEDBACK_KEY="remindue.feedback.v1"; $("feedbackText").value=localStorage.getItem(FEEDBACK_KEY)||""; $("editFeedbackBtn").onclick=()=>{ $("feedbackText").disabled=false; $("feedbackText").focus(); $("editFeedbackBtn").classList.add("hidden"); $("saveFeedbackBtn").classList.remove("hidden"); }; $("saveFeedbackBtn").onclick=()=>{ if(!confirm("Save your enhancements / feedback?"))return; localStorage.setItem(FEEDBACK_KEY,$("feedbackText").value.trim()); $("feedbackText").disabled=true; $("saveFeedbackBtn").classList.add("hidden"); $("editFeedbackBtn").classList.remove("hidden"); alert("Feedback saved."); };

document.addEventListener("click", e => {
  const open = e.target.closest("[data-action='open-add']");
  if (open) openAdd();

  const edit = e.target.closest("[data-edit]");
  if (edit) openEdit(edit.dataset.edit);

  const complete = e.target.closest("[data-complete]");
  if (complete) openCompletion(complete.dataset.complete);
  const cd = e.target.closest("[data-calendar-date]");
  if (cd) { document.querySelectorAll(".calendar-day.selected").forEach(x=>x.classList.remove("selected")); cd.classList.add("selected"); renderCalendarAgenda(cd.dataset.calendarDate); }

  const nav = e.target.closest("[data-view]");
  if (nav) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.remove("active"));
    $(nav.dataset.view).classList.add("active");
    nav.classList.add("active");
    if (nav.dataset.view === "insightsView") renderInsights();
  }
});

$("closeDialog").onclick = () => dialog.close();
$("cancelBtn").onclick = () => dialog.close();
$("deleteBtn").onclick = () => {
  const id = $("itemId").value;
  if (confirm("Delete this item permanently?")) {
    items = items.filter(i => i.id !== id);
    saveItems(items);
    dialog.close();
    renderAll();
  }
};

$("searchInput").addEventListener("input", renderItems);
$("typeFilter").addEventListener("change", renderItems);
$("prevMonth").onclick = () => { calendarCursor.setMonth(calendarCursor.getMonth()-1); renderCalendar(); };
$("nextMonth").onclick = () => { calendarCursor.setMonth(calendarCursor.getMonth()+1); renderCalendar(); };

$("exportBtn").onclick = () => exportBackup(items);
$("exportCsvBtn").onclick = () => exportCsv(items);
$("importInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (!confirm("Import this backup? Existing ReminDUE data will be replaced.")) { e.target.value=""; return; }
    items = await importBackup(file);
    renderAll();
    alert("Backup imported successfully.");
  } catch (err) {
    alert(err.message || "Unable to import backup.");
  }
  e.target.value = "";
});

async function enableNotifications() {
  const ok = await requestNotifications();
  if (ok) {
    checkAndNotify(items);
    alert("Notifications enabled.");
  }
}
$("notificationBtn").onclick = enableNotifications;
$("notificationSettingsBtn").onclick = enableNotifications;

seedIfEmpty();
renderAll();
checkAndNotify(items);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
}
