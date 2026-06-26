// schedule.js
// Single source of truth for the recurring weekly meeting roster and
// for turning that roster + Firestore data into FullCalendar events.
// Both index.html (public, read-only) and admin.html (editor) import
// this file instead of each maintaining their own copy of the
// schedule-generation logic.

import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Recurring weekly slots, keyed by Date.getDay() (0 = Sunday ... 6 = Saturday).
// To change what meets on a given day of the week, edit it here once —
// both pages and the printed legend will reflect it automatically.
export const WEEKLY_SLOTS = {
  0: [{ num: 1, time: "18:30", name: "Detox" }],
  1: [{ num: 1, time: "18:30", name: "Detox" }],
  2: [{ num: 1, time: "18:30", name: "Detox" }],
  3: [
    { num: 1, time: "18:30", name: "Detox" },
    { num: 2, time: "19:00", name: "Recovery" }
  ],
  4: [{ num: 1, time: "20:00", name: "Detox" }],
  5: [{ num: 1, time: "18:30", name: "Detox" }],
  6: [
    { num: 1, time: "18:00", name: "Men" },
    { num: 2, time: "18:00", name: "Women" },
    { num: 3, time: "18:30", name: "Detox" }
  ]
};

// Extra slots that only exist on the first Friday of each month.
export const FIRST_FRIDAY_SLOTS = [
  { num: 2, time: "19:00", name: "FIRST FRIDAY CH" },
  { num: 3, time: "19:00", name: "Sp" }
];

export function isFirstFriday(date) {
  return date.getDay() === 5 && date.getDate() <= 7;
}

export function getSlotsForDate(date) {
  const slots = WEEKLY_SLOTS[date.getDay()] || [];
  return isFirstFriday(date) ? [...slots, ...FIRST_FRIDAY_SLOTS] : slots;
}

export function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftKey(dateIso, slot) {
  return `${dateIso}_${slot.time}_${slot.name}`;
}

// Pulls every claimed shift from Firestore into a lookup map, keyed the
// same way generateEvents() keys its template slots. One read, one
// pass — no per-day Firestore queries.
export async function fetchClaimedShifts(db) {
  const snapshot = await getDocs(collection(db, "meetings"));
  const claimed = {};
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    claimed[shiftKey(data.date, { time: data.time, name: data.meetingName })] = {
      id: docSnap.id,
      chairName: data.chairName
    };
  });
  return claimed;
}

// Builds FullCalendar event objects for every day in the visible range.
// `colors` lets the public page and the admin editor use different
// palettes for open vs. claimed shifts without duplicating this logic.
export function generateEvents({ start, end }, claimedShifts, colors) {
  const events = [];
  const cursor = new Date(start);
  const rangeEnd = new Date(end);

  while (cursor < rangeEnd) {
    const dateIso = toIsoDate(cursor);
    const dayOfWeek = cursor.getDay();
    const firstFriday = isFirstFriday(cursor);

    getSlotsForDate(cursor).forEach((slot) => {
      const key = shiftKey(dateIso, slot);
      const claim = claimedShifts[key];

      events.push({
        id: claim ? claim.id : `template_${key}`,
        title: claim ? `${slot.num}. ${slot.name}: ${claim.chairName}` : `${slot.num}. ${slot.name}`,
        start: `${dateIso}T${slot.time}`,
        backgroundColor: claim ? colors.claimedBg : colors.openBg,
        textColor: claim ? colors.claimedText : colors.openText,
        extendedProps: {
          isTemplate: !claim,
          meetingName: slot.name,
          dateStr: dateIso,
          timeStr: slot.time,
          dayOfWeekIndex: dayOfWeek,
          isFirstFriday: firstFriday
        }
      });
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}

// Drops a small red "FIRST FRIDAY" marker into the top of that day's cell.
export function markFirstFridayCell(info) {
  if (!isFirstFriday(info.date)) return;

  const marker = document.createElement("div");
  marker.className = "first-friday-marker";
  marker.textContent = "FIRST FRIDAY";

  const topFrame = info.el.querySelector(".fc-daygrid-day-top");
  if (topFrame) {
    topFrame.insertBefore(marker, topFrame.firstChild);
    topFrame.classList.add("fc-daygrid-day-top--with-marker");
  }
}

// Shared FullCalendar configuration used by both pages.
//
// dayMaxEvents is explicitly set to false (no cap). The old config left
// this as `true`, which made FullCalendar collapse any day with more
// than a couple of shifts (e.g. every Saturday, with 3 shifts) into a
// "+2 more" link. That link can't be clicked or read on a printed page,
// which is exactly the issue you flagged — so the cap is removed
// entirely and every day cell just grows to show all of its shifts.
export const BASE_CALENDAR_OPTIONS = {
  initialView: "dayGridMonth",
  displayEventTime: false,
  eventDisplay: "block",
  dayMaxEvents: false,
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek"
  },
  eventTimeFormat: { hour: "numeric", minute: "2-digit", meridiem: "short" },
  dayCellDidMount: markFirstFridayCell
};
