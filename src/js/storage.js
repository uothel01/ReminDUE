
const KEY="remindue.items.v1";
export function loadItems(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}
export function saveItems(items){localStorage.setItem(KEY,JSON.stringify(items))}
function download(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
export function exportBackup(items){download(new Blob([JSON.stringify({app:"ReminDUE",version:1,exportedAt:new Date().toISOString(),items},null,2)],{type:"application/json"}),`ReminDUE-backup-${new Date().toISOString().slice(0,10)}.json`)}
export function exportCsv(items){const h=["Title","Type","Category","Due Date","Amount","Repeat","Reminder Days","Status","Completed Date","Completion Notes","Notes"];const rows=items.map(i=>[i.title,i.type,i.category||"",i.dueDate,i.amount||"",i.repeat,i.reminderDays,i.status,i.completedDate||"",i.completionNotes||"",i.notes||""]);const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");download(new Blob([csv],{type:"text/csv;charset=utf-8"}),`ReminDUE-${new Date().toISOString().slice(0,10)}.csv`)}
export async function importBackup(file){const p=JSON.parse(await file.text());const items=Array.isArray(p)?p:p.items;if(!Array.isArray(items))throw new Error("Invalid ReminDUE backup.");saveItems(items);return items}
