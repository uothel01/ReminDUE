
export function parseDate(value){const [y,m,d]=String(value).split("-").map(Number);return new Date(y,m-1,d)}
export function toDateInput(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
export function daysFromToday(value){const t=new Date();t.setHours(0,0,0,0);const d=parseDate(value);d.setHours(0,0,0,0);return Math.round((d-t)/86400000)}
export function addRepeat(value,repeat){const d=parseDate(value);if(repeat==="weekly")d.setDate(d.getDate()+7);if(repeat==="monthly")d.setMonth(d.getMonth()+1);if(repeat==="quarterly")d.setMonth(d.getMonth()+3);if(repeat==="halfyearly")d.setMonth(d.getMonth()+6);if(repeat==="yearly")d.setFullYear(d.getFullYear()+1);return toDateInput(d)}
export function formatDate(value,options={day:"numeric",month:"short",year:"numeric"}){return parseDate(value).toLocaleDateString(undefined,options)}
export function dueText(value){const n=daysFromToday(value);if(n<0)return `${Math.abs(n)} day${Math.abs(n)===1?"":"s"} overdue`;if(n===0)return "Due today";if(n===1)return "Due tomorrow";return `Due in ${n} days`}
