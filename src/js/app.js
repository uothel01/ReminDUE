
import {loadItems,saveItems,exportBackup,exportCsv,importBackup} from "./storage.js";
import {daysFromToday,addRepeat,formatDate,dueText,parseDate,toDateInput} from "./dates.js";
import {requestNotifications,checkAndNotify} from "./notifications.js";

const TYPE_LABELS={payment:"Payment",renewal:"Renewal",appointment:"Appointment",maintenance:"Maintenance",reminder:"Reminder"};
const ICONS={payment:"₹",renewal:"↻",appointment:"🩺",maintenance:"🔧",reminder:"🔔"};
const FEEDBACK_KEY="remindue.feedback.v1";

let items=[];
let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);

const $=id=>document.getElementById(id);
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function statusFor(i){if(i.status==="completed")return"completed";const d=daysFromToday(i.dueDate);return d<0?"overdue":d===0?"today":"upcoming"}
function amountText(i){return i.amount?`₹${Number(i.amount).toLocaleString("en-IN")}`:""}

function itemCard(i){
  const status=statusFor(i);
  const meta=[amountText(i),formatDate(i.dueDate),dueText(i.dueDate)].filter(Boolean).join(" · ");
  const completed=i.status==="completed"&&i.completedDate?`<br>Completed: ${formatDate(i.completedDate)}${i.completionNotes?` · ${escapeHtml(i.completionNotes)}`:""}`:"";
  return `<article class="item-card ${status}">
    <div class="item-icon">${ICONS[i.type]||"•"}</div>
    <div><div class="item-title">${escapeHtml(i.title)}</div>
    <div class="item-meta">${escapeHtml(meta)}${i.category?`<br>${escapeHtml(i.category)}`:""}${completed}</div></div>
    <div class="item-actions">
      ${i.status!=="completed"?`<button type="button" class="mini done" data-complete="${i.id}">${i.type==="payment"?"Mark paid":"Complete"}</button>`:""}
      <button type="button" class="mini" data-edit="${i.id}">Edit</button>
    </div>
  </article>`;
}

function renderHome(){
  const active=items.filter(i=>i.status!=="completed");
  $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
  $("dueSoonCount").textContent=active.filter(i=>{const d=daysFromToday(i.dueDate);return d>=0&&d<=7}).length;
  $("overdueCount").textContent=active.filter(i=>daysFromToday(i.dueDate)<0).length;
  const now=new Date();
  $("monthCount").textContent=active.filter(i=>{const d=parseDate(i.dueDate);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).length;
  const sorted=[...active].sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const groups=[["Overdue",sorted.filter(i=>daysFromToday(i.dueDate)<0)],["Today",sorted.filter(i=>daysFromToday(i.dueDate)===0)],["Upcoming",sorted.filter(i=>daysFromToday(i.dueDate)>0)]];
  $("timeline").innerHTML=groups.map(([n,a])=>a.length?`<h3 class="group-title">${n}</h3>${a.map(itemCard).join("")}`:"").join("")||`<div class="empty">No active items. Add your first reminder.</div>`;
}

function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  $("calendarTitle").textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const first=new Date(y,m,1), start=new Date(y,m,1-first.getDay());
  const today=new Date();today.setHours(0,0,0,0);
  const names=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>`<div class="day-name">${x}</div>`).join("");
  let cells="";
  for(let n=0;n<42;n++){
    const d=new Date(start);d.setDate(start.getDate()+n);
    const key=toDateInput(d);
    const dayItems=items.filter(i=>i.dueDate===key);
    const selected=$("calendarGrid").dataset.selectedDate===key;
    cells+=`<button type="button" class="calendar-day ${d.getMonth()!==m?"muted":""} ${d.getTime()===today.getTime()?"today":""} ${selected?"selected":""}" data-calendar-date="${key}">
      <div>${d.getDate()}</div><div class="dot-row">${dayItems.slice(0,6).map(i=>`<span class="dot ${statusFor(i)==="overdue"?"overdue":""}"></span>`).join("")}</div>
    </button>`;
  }
  $("calendarGrid").innerHTML=names+cells;
  const selected=$("calendarGrid").dataset.selectedDate;
  if(selected&&selected.startsWith(`${y}-${String(m+1).padStart(2,"0")}`))renderCalendarAgenda(selected);
  else renderCalendarAgenda(null);
}

function renderCalendarAgenda(selectedDate){
  let list,heading;
  if(selectedDate){
    list=items.filter(i=>i.dueDate===selectedDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    heading=`Items on ${formatDate(selectedDate,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}`;
  }else{
    const prefix=`${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth()+1).padStart(2,"0")}`;
    list=items.filter(i=>i.dueDate.startsWith(prefix)).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    heading="This month";
  }
  $("calendarAgenda").innerHTML=list.length?`<h3 class="group-title">${heading}</h3>${list.map(itemCard).join("")}`:`<div class="empty">${heading}: no items.</div>`;
}

function renderInsights(){
  const dim=$("insightDimension").value,period=$("insightPeriod").value;
  const filtered=items.filter(i=>period==="all"||Math.abs(daysFromToday(i.dueDate))<=Number(period));
  const active=filtered.filter(i=>i.status!=="completed"),completed=filtered.filter(i=>i.status==="completed"),overdue=active.filter(i=>daysFromToday(i.dueDate)<0);
  $("insightSummary").innerHTML=`<div class="insight-kpi"><span>Total</span><strong>${filtered.length}</strong></div><div class="insight-kpi"><span>Upcoming</span><strong>${active.length}</strong></div><div class="insight-kpi"><span>Completed</span><strong>${completed.length}</strong></div><div class="insight-kpi danger-kpi"><span>Overdue</span><strong>${overdue.length}</strong></div>`;
  if(!filtered.length){$("insightReport").innerHTML=`<div class="empty">No data for the selected period.</div>`;return}
  let groups={};
  if(dim==="status"){
    groups={"Upcoming / active":active,"Completed / paid":completed,"Overdue":overdue};
  }else if(dim==="date"){
    filtered.forEach(i=>{const k=i.dueDate.slice(0,7);(groups[k]??=[]).push(i)});
  }else{
    filtered.forEach(i=>{const k=dim==="type"?TYPE_LABELS[i.type]:(i.category||"Uncategorised");(groups[k]??=[]).push(i)});
  }
  $("insightReport").innerHTML=Object.keys(groups).sort().map(k=>{
    const a=groups[k],c=a.filter(i=>i.status==="completed").length,o=a.filter(i=>i.status!=="completed"&&daysFromToday(i.dueDate)<0).length;
    const title=dim==="date"?formatDate(`${k}-01`,{month:"long",year:"numeric"}):k;
    return `<section class="report-group"><div class="report-head"><strong>${escapeHtml(title)}</strong><span>${a.length} item${a.length===1?"":"s"} · ${c} completed${o?` · ${o} overdue`:""}</span></div><div class="progress"><span style="width:${Math.round(c/a.length*100)}%"></span></div>${a.slice(0,5).map(i=>`<div class="report-row"><span>${escapeHtml(i.title)}</span><span>${formatDate(i.dueDate)}</span></div>`).join("")}${a.length>5?`<div class="report-more">+ ${a.length-5} more</div>`:""}</section>`;
  }).join("");
}

function showView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.remove("active"));
  const view=$(id),nav=document.querySelector(`[data-view="${id}"]`);
  if(!view)return;
  view.classList.add("active");if(nav)nav.classList.add("active");
  if(id==="calendarView")renderCalendar();
  if(id==="insightsView")renderInsights();
}

function openAdd(){
  $("itemForm").reset();$("dialogTitle").textContent="Add item";$("itemId").value="";
  $("dueDate").value=toDateInput(new Date());$("reminderDays").value="7";$("deleteBtn").classList.add("hidden");$("itemDialog").showModal();
}

function openEdit(id){
  const i=items.find(x=>x.id===id);if(!i)return;
  $("dialogTitle").textContent="Edit item";$("itemId").value=i.id;$("title").value=i.title;$("type").value=i.type;$("category").value=i.category||"";
  $("dueDate").value=i.dueDate;$("amount").value=i.amount||"";$("repeat").value=i.repeat;$("reminderDays").value=i.reminderDays;$("notes").value=i.notes||"";
  $("deleteBtn").classList.remove("hidden");$("itemDialog").showModal();
}

function openCompletion(id){
  const i=items.find(x=>x.id===id);if(!i)return;
  $("completionItemId").value=id;$("completionTitle").textContent=i.type==="payment"?"Mark as paid":"Mark as completed";
  $("completedDate").value=toDateInput(new Date());$("completionNotes").value="";$("completionDialog").showModal();
}

function completeItem(id,date,notes){
  const i=items.find(x=>x.id===id);if(!i)return;
  if(i.repeat&&i.repeat!=="none"){
    const history={...i,id:crypto.randomUUID(),status:"completed",completedDate:date,completionNotes:notes,completedAt:new Date().toISOString()};
    i.dueDate=addRepeat(i.dueDate,i.repeat);i.status="upcoming";i.completedDate="";i.completionNotes="";i.completedAt="";items.push(history);
  }else{i.status="completed";i.completedDate=date;i.completionNotes=notes;i.completedAt=new Date().toISOString()}
  saveItems(items);renderAll();checkAndNotify(items);
}

function renderAll(){renderHome();renderCalendar();renderInsights()}

function bind(){
  $("itemForm").addEventListener("submit",e=>{
    e.preventDefault();
    const id=$("itemId").value,old=id?items.find(i=>i.id===id):null;
    const next={id:id||crypto.randomUUID(),title:$("title").value.trim(),type:$("type").value,category:$("category").value.trim(),dueDate:$("dueDate").value,amount:$("amount").value,repeat:$("repeat").value,reminderDays:$("reminderDays").value,notes:$("notes").value.trim(),status:old?.status||"upcoming",createdAt:old?.createdAt||new Date().toISOString(),completedDate:old?.completedDate||"",completionNotes:old?.completionNotes||"",completedAt:old?.completedAt||""};
    if(!next.title||!next.dueDate){alert("Please enter a title and due date.");return}
    if(old&&!confirm(`Update "${old.title}"?\n\nChoose OK to save the changes.`))return;
    if(old)items=items.map(i=>i.id===id?next:i);else items.push(next);
    saveItems(items);$("itemDialog").close();renderAll();checkAndNotify(items);
  });

  $("completionForm").addEventListener("submit",e=>{
    e.preventDefault();const date=$("completedDate").value,notes=$("completionNotes").value.trim();
    if(!date||!notes){alert("Completion date and completion notes are mandatory.");return}
    if(!confirm(`Confirm completion/payment on ${formatDate(date)}?\n\nNotes: ${notes}`))return;
    completeItem($("completionItemId").value,date,notes);$("completionDialog").close();
  });

  document.addEventListener("click",e=>{
    const nav=e.target.closest("[data-view]");if(nav){showView(nav.dataset.view);return}
    const add=e.target.closest("[data-action='open-add']");if(add){openAdd();return}
    const edit=e.target.closest("[data-edit]");if(edit){openEdit(edit.dataset.edit);return}
    const done=e.target.closest("[data-complete]");if(done){openCompletion(done.dataset.complete);return}
    const date=e.target.closest("[data-calendar-date]");if(date){$("calendarGrid").dataset.selectedDate=date.dataset.calendarDate;renderCalendar();return}
  });

  $("prevMonth").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);$("calendarGrid").dataset.selectedDate="";renderCalendar()});
  $("nextMonth").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);$("calendarGrid").dataset.selectedDate="";renderCalendar()});
  $("insightDimension").addEventListener("change",renderInsights);$("insightPeriod").addEventListener("change",renderInsights);

  $("closeDialog").addEventListener("click",()=>$("itemDialog").close());$("cancelBtn").addEventListener("click",()=>$("itemDialog").close());
  $("closeCompletion").addEventListener("click",()=>$("completionDialog").close());$("cancelCompletion").addEventListener("click",()=>$("completionDialog").close());

  $("deleteBtn").addEventListener("click",()=>{
    const i=items.find(x=>x.id===$("itemId").value);if(!i)return;
    if(confirm(`Delete "${i.title}" permanently?\n\nThis cannot be undone.`)){items=items.filter(x=>x.id!==i.id);saveItems(items);$("itemDialog").close();renderAll()}
  });

  $("exportBtn").addEventListener("click",()=>exportBackup(items));$("exportCsvBtn").addEventListener("click",()=>exportCsv(items));
  $("importInput").addEventListener("change",async e=>{
    const f=e.target.files[0];if(!f)return;
    if(!confirm("Import this backup?\n\nExisting ReminDUE data will be replaced.")){e.target.value="";return}
    try{items=await importBackup(f);renderAll();alert("Backup imported successfully.")}catch(err){alert(err.message||"Unable to import backup.")}e.target.value="";
  });

  const feedback=$("feedbackText");feedback.value=localStorage.getItem(FEEDBACK_KEY)||"";
  $("editFeedbackBtn").addEventListener("click",()=>{feedback.disabled=false;feedback.focus();$("editFeedbackBtn").classList.add("hidden");$("saveFeedbackBtn").classList.remove("hidden")});
  $("saveFeedbackBtn").addEventListener("click",()=>{if(!confirm("Save your enhancements / feedback?"))return;localStorage.setItem(FEEDBACK_KEY,feedback.value.trim());feedback.disabled=true;$("saveFeedbackBtn").classList.add("hidden");$("editFeedbackBtn").classList.remove("hidden");alert("Feedback saved.")});

  const enable=async()=>{if(await requestNotifications()){checkAndNotify(items);alert("Notifications enabled.")}};
  $("notificationBtn").addEventListener("click",enable);$("notificationSettingsBtn").addEventListener("click",enable);
}

function init(){
  items=loadItems();
  bind();
  renderAll();
  checkAndNotify(items);
  if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
