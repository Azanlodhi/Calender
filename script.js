// Modern Calendar with small event storage (localStorage)
// Save as script.js and include in index.html

// --- Utilities ---
const now = new Date();
let currentYear = now.getFullYear();
let currentMonth = now.getMonth(); // 0-indexed
let selectedDate = null; // Date string 'YYYY-MM-DD'

// DOM elements
const monthLabel = document.getElementById("monthLabel");
const yearLabel = document.getElementById("yearLabel");
const monthSelect = document.getElementById("monthSelect");
const yearInput = document.getElementById("yearInput");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const goBtn = document.getElementById("goBtn");
const todayBtn = document.getElementById("todayBtn");
const datesGrid = document.getElementById("datesGrid");
const eventPanel = document.getElementById("eventPanel");
const eventDateLabel = document.getElementById("eventDateLabel");
const eventList = document.getElementById("eventList");
const eventForm = document.getElementById("eventForm");
const eventTitle = document.getElementById("eventTitle");
const eventTime = document.getElementById("eventTime");
const eventNotes = document.getElementById("eventNotes");
const closePanel = document.getElementById("closePanel");
const clearEvents = document.getElementById("clearEvents");
const toggleEvents = document.getElementById("toggleEvents");

// localStorage key
const STORAGE_KEY = "simple_calendar_events_v1";

// initialize month dropdown
function populateMonthSelect() {
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  months.forEach((m,i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    monthSelect.appendChild(opt);
  });
}
populateMonthSelect();

// load events from storage
function loadEvents() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) } catch { return {} }
}
function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// format YYYY-MM-DD
function formatDateObj(y,m,d){
  const mm = String(m+1).padStart(2,"0");
  const dd = String(d).padStart(2,"0");
  return `${y}-${mm}-${dd}`;
}

// render calendar
function renderCalendar(year,month){
  datesGrid.innerHTML = "";
  monthLabel.textContent = new Date(year,month).toLocaleString(undefined,{month:"long"});
  yearLabel.textContent = year;
  monthSelect.value = month;
  yearInput.value = year;

  const firstDay = new Date(year,month,1).getDay(); // 0..6
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const events = loadEvents();

  // create leading blanks from previous month
  for(let i = firstDay - 1; i >= 0; i--){
    const day = prevDays - i;
    const cell = createDateCell(year, month-1, day, true, events);
    datesGrid.appendChild(cell);
  }

  // this month's days
  for(let d=1; d<=daysInMonth; d++){
    const cell = createDateCell(year, month, d, false, events);
    datesGrid.appendChild(cell);
  }

  // fill remaining cells to complete the grid (total 42 cells max)
  const totalCells = datesGrid.children.length;
  const needed = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for(let k=1; k<=needed; k++){
    const cell = createDateCell(year, month+1, k, true, events);
    datesGrid.appendChild(cell);
  }
}

// create a date cell element
function createDateCell(year, month, day, otherMonth=false, events) {
  const cell = document.createElement("div");
  cell.className = "date-cell" + (otherMonth ? " other-month" : "");
  cell.tabIndex = 0;
  cell.setAttribute("role","gridcell");
  const dateNum = document.createElement("div");
  dateNum.className = "date-number";
  dateNum.textContent = day;
  cell.appendChild(dateNum);

  const dateKey = formatDateObj(year, month, day);
  // highlight today
  const todayKey = formatDateObj(now.getFullYear(), now.getMonth(), now.getDate());
  if (dateKey === todayKey) cell.classList.add("today");
  if (selectedDate === dateKey) cell.classList.add("selected");

  // show first event preview if exists
  const dayEvents = (events && events[dateKey]) || [];
  if(dayEvents.length){
    const preview = document.createElement("div");
    preview.className = "event-preview";
    preview.textContent = dayEvents[0].title || "(event)";
    cell.appendChild(preview);

    const dot = document.createElement("div");
    dot.className = "event-dot";
    cell.appendChild(dot);
  }

  // click behavior
  cell.addEventListener("click", ()=>{
    // mark selection
    document.querySelectorAll(".date-cell.selected").forEach(n=>n.classList.remove("selected"));
    cell.classList.add("selected");
    selectedDate = dateKey;
    openEventPanel(dateKey);
  });

  // keyboard accessibility (Enter)
  cell.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      cell.click();
    }
  });

  return cell;
}

// open event panel for a date
function openEventPanel(dateKey){
  eventPanel.classList.remove("hidden");
  eventPanel.setAttribute("aria-hidden","false");
  eventDateLabel.textContent = `Events for ${dateKey}`;
  renderEventList(dateKey);
}

// render events
function renderEventList(dateKey){
  const events = loadEvents();
  const dayEvents = (events[dateKey] || []).slice().sort((a,b)=>{
    return (a.time || "").localeCompare(b.time || "");
  });

  eventList.innerHTML = "";
  if(!dayEvents.length){
    const li = document.createElement("li");
    li.textContent = "No events for this day.";
    eventList.appendChild(li);
  } else {
    dayEvents.forEach((ev,i)=>{
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.innerHTML = `<div style="font-weight:700">${ev.title}</div>
                        <div class="meta">${ev.time || ""} ${ev.notes ? "• "+ev.notes : ""}</div>`;
      const right = document.createElement("div");
      const del = document.createElement("button");
      del.textContent = "Delete";
      del.style.background="transparent";
      del.style.border="none";
      del.style.color="var(--danger)";
      del.style.cursor="pointer";
      del.addEventListener("click", ()=>{
        deleteEvent(dateKey, i);
      });
      right.appendChild(del);
      li.appendChild(left);
      li.appendChild(right);
      eventList.appendChild(li);
    });
  }
}

// add event
eventForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  if(!selectedDate) return alert("Select a date first.");
  const title = eventTitle.value.trim();
  if(!title) return alert("Please enter a title.");
  const time = eventTime.value;
  const notes = eventNotes.value.trim();

  const events = loadEvents();
  if(!events[selectedDate]) events[selectedDate] = [];
  events[selectedDate].push({ title, time, notes, createdAt: new Date().toISOString() });
  saveEvents(events);

  // reset form and update UI
  eventForm.reset();
  renderEventList(selectedDate);
  renderCalendar(currentYear, currentMonth); // update dots/preview
});

// delete single event by index
function deleteEvent(dateKey, idx){
  const events = loadEvents();
  if(!events[dateKey]) return;
  events[dateKey].splice(idx,1);
  if(events[dateKey].length === 0) delete events[dateKey];
  saveEvents(events);
  renderEventList(dateKey);
  renderCalendar(currentYear, currentMonth);
}

// clear all events for day
clearEvents.addEventListener("click", ()=>{
  if(!selectedDate) return;
  if(!confirm("Remove all events for " + selectedDate + "?")) return;
  const events = loadEvents();
  delete events[selectedDate];
  saveEvents(events);
  renderEventList(selectedDate);
  renderCalendar(currentYear, currentMonth);
});

// open/close panel
closePanel.addEventListener("click", ()=>{
  eventPanel.classList.add("hidden");
  eventPanel.setAttribute("aria-hidden","true");
  document.querySelectorAll(".date-cell.selected").forEach(n=>n.classList.remove("selected"));
  selectedDate = null;
});

// prev / next month
prevBtn.addEventListener("click", ()=>{
  currentMonth--;
  if(currentMonth < 0){ currentMonth = 11; currentYear--; }
  renderCalendar(currentYear, currentMonth);
});
nextBtn.addEventListener("click", ()=>{
  currentMonth++;
  if(currentMonth > 11){ currentMonth = 0; currentYear++; }
  renderCalendar(currentYear, currentMonth);
});

// Go button
goBtn.addEventListener("click", ()=>{
  const y = parseInt(yearInput.value,10);
  const m = parseInt(monthSelect.value,10);
  if(!isNaN(y) && !isNaN(m)){
    currentYear = y;
    currentMonth = m;
    renderCalendar(currentYear, currentMonth);
  }
});

// Today button
todayBtn.addEventListener("click", ()=>{
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  renderCalendar(currentYear, currentMonth);
});

// toggle event panel with button
toggleEvents.addEventListener("click", ()=>{
  const isHidden = eventPanel.classList.contains("hidden");
  if(isHidden){
    // if no selected date, open today's
    if(!selectedDate) {
      selectedDate = formatDateObj(currentYear, currentMonth, now.getDate());
      document.querySelectorAll(".date-cell.selected").forEach(n=>n.classList.remove("selected"));
    }
    eventPanel.classList.remove("hidden");
    eventPanel.setAttribute("aria-hidden","false");
  } else {
    eventPanel.classList.add("hidden");
    eventPanel.setAttribute("aria-hidden","true");
  }
});

// initialize year input with current year
yearInput.value = currentYear;

// initialize
renderCalendar(currentYear, currentMonth);

// small improvement: clicking outside panel closes it
document.addEventListener("click", (e)=>{
  if(!eventPanel.contains(e.target) && !e.target.closest(".date-cell") && !e.target.closest("#toggleEvents")){
    // do not auto-close if user interacts with a date cell or button
    // keep panel open for convenience
  }
});
