// ===== 저장소 유틸 =====
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 저장 불가 환경은 무시 */
    }
  },
};

const RUN_KEY = "slowrun.runs";
const TREK_KEY = "slowrun.treks";

let runs = store.get(RUN_KEY, []);
let treks = store.get(TREK_KEY, {}); // { "2026-03": {place, date, distance, level, note} }

const $ = (sel) => document.querySelector(sel);
const today = new Date();
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ===== 포맷 =====
function formatPace(minPerKm) {
  if (!isFinite(minPerKm) || minPerKm <= 0) return "-";
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return s === 60 ? `${m + 1}'00"` : `${m}'${pad(s)}"`;
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

const round1 = (n) => Math.round(n * 10) / 10;

// ===== 러닝 =====
function renderRuns() {
  const sorted = [...runs].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const list = $("#runList");
  list.innerHTML = "";

  sorted.forEach((r) => {
    const li = document.createElement("li");
    li.className = "run-item";
    li.innerHTML = `
      <span class="run-mood">${r.mood}</span>
      <div class="run-main">
        <strong>${r.distance} km · ${r.minutes}분</strong>
        <span>${formatDate(r.date)}${r.memo ? " · " + escapeHTML(r.memo) : ""}</span>
      </div>
      <span class="run-pace">${formatPace(r.minutes / r.distance)}/km</span>
      <div class="run-actions">
        <button class="edit-btn" aria-label="수정" title="수정" data-id="${r.id}">✎</button>
        <button class="del-btn" aria-label="삭제" title="삭제" data-id="${r.id}">×</button>
      </div>
    `;
    if (r.id === editingRunId) li.classList.add("editing");
    list.appendChild(li);
  });

  $("#runEmpty").style.display = runs.length ? "none" : "block";

  // 통계
  const totalKm = runs.reduce((s, r) => s + r.distance, 0);
  const totalMin = runs.reduce((s, r) => s + r.minutes, 0);
  $("#statRuns").textContent = runs.length;
  $("#statKm").textContent = round1(totalKm);
  $("#statTime").textContent = round1(totalMin / 60);
  $("#statPace").textContent = totalKm ? formatPace(totalMin / totalKm) : "-";

  // 페이스 팁
  const avg = totalKm ? totalMin / totalKm : 0;
  $("#paceTip").textContent = !avg
    ? ""
    : avg < 6
    ? "조금 더 천천히 달려도 괜찮아요 🐢"
    : "좋아요, 대화가 가능한 속도예요 🙂";

  renderWeekBars();
  renderHero();
}

function renderWeekBars() {
  const wrap = $("#weekBars");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = toISO(d);
    const km = runs.filter((r) => r.date === iso).reduce((s, r) => s + r.distance, 0);
    data.push({ label: i === 0 ? "오늘" : days[d.getDay()], km });
  }
  const max = Math.max(...data.map((d) => d.km), 1);
  wrap.innerHTML = data
    .map(
      (d) => `
      <div class="bar-col">
        <span class="bar-val">${d.km ? round1(d.km) : ""}</span>
        <div class="bar ${d.km ? "" : "zero"}" style="height:${d.km ? (d.km / max) * 70 : 3}%"></div>
        <span class="bar-day">${d.label}</span>
      </div>`
    )
    .join("");
}

let editingRunId = null;
const runForm = $("#runForm");

function resetRunForm() {
  editingRunId = null;
  runForm.reset();
  runForm.date.value = toISO(today);
  $("#runFormTitle").textContent = "오늘의 러닝 추가";
  $("#runSubmit").textContent = "기록하기";
  $("#runCancel").hidden = true;
}

function startEditRun(id) {
  const r = runs.find((x) => x.id === id);
  if (!r) return;
  editingRunId = id;
  runForm.date.value = r.date;
  runForm.distance.value = r.distance;
  runForm.minutes.value = r.minutes;
  runForm.memo.value = r.memo;
  const mood = runForm.querySelector(`input[name="mood"][value="${r.mood}"]`);
  if (mood) mood.checked = true;
  $("#runFormTitle").textContent = "러닝 기록 수정";
  $("#runSubmit").textContent = "수정 완료";
  $("#runCancel").hidden = false;
  renderRuns();
  runForm.scrollIntoView({ behavior: "smooth", block: "center" });
  runForm.distance.focus({ preventScroll: true });
}

runForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(runForm);
  const data = {
    date: fd.get("date"),
    distance: parseFloat(fd.get("distance")),
    minutes: parseInt(fd.get("minutes"), 10),
    mood: fd.get("mood"),
    memo: fd.get("memo").trim(),
  };
  if (editingRunId) {
    runs = runs.map((r) => (r.id === editingRunId ? { ...r, ...data } : r));
  } else {
    runs.push({ id: Date.now(), ...data });
  }
  store.set(RUN_KEY, runs);
  resetRunForm();
  renderRuns();
});

$("#runCancel").addEventListener("click", () => {
  resetRunForm();
  renderRuns();
});

$("#runList").addEventListener("click", (e) => {
  const editBtn = e.target.closest(".edit-btn");
  if (editBtn) return startEditRun(Number(editBtn.dataset.id));

  const btn = e.target.closest(".del-btn");
  if (!btn) return;
  if (!confirm("이 러닝 기록을 삭제할까요?")) return;
  const id = Number(btn.dataset.id);
  runs = runs.filter((r) => r.id !== id);
  store.set(RUN_KEY, runs);
  if (id === editingRunId) resetRunForm();
  renderRuns();
});

// ===== 트레킹 =====
let viewYear = today.getFullYear();
let editingKey = null;
const dialog = $("#trekDialog");
const trekForm = $("#trekForm");

function renderTreks() {
  $("#yearLabel").textContent = viewYear;
  const grid = $("#trekGrid");
  grid.innerHTML = "";
  let done = 0;

  for (let m = 1; m <= 12; m++) {
    const key = `${viewYear}-${pad(m)}`;
    const t = treks[key];
    const isCurrent = viewYear === today.getFullYear() && m === today.getMonth() + 1;
    if (t) done++;

    const card = document.createElement("button");
    card.type = "button";
    card.className = `trek-card${t ? " done" : ""}${isCurrent ? " current" : ""}`;
    card.dataset.key = key;

    const badge = isCurrent
      ? `<span class="trek-badge now">이번 달</span>`
      : t
      ? `<span class="trek-badge">완료</span>`
      : "";

    card.innerHTML = t
      ? `
        <span class="trek-month">${m}월</span>${badge}
        <span class="trek-place">⛰️ ${escapeHTML(t.place)}</span>
        <span class="trek-meta">${formatDate(t.date)}${t.distance ? " · " + t.distance + "km" : ""} · ${t.level}</span>
        ${t.note ? `<span class="trek-note">“${escapeHTML(t.note)}”</span>` : ""}
      `
      : `
        <span class="trek-month">${m}월</span>${badge}
        <span class="trek-empty"><b>+</b>어디로 떠나볼까요?</span>
      `;
    grid.appendChild(card);
  }

  $("#trekProgress").style.width = `${(done / 12) * 100}%`;
  $("#trekProgressText").textContent = `${done} / 12`;
  renderHero();
}

$("#trekGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".trek-card");
  if (!card) return;
  openTrekDialog(card.dataset.key);
});

function openTrekDialog(key) {
  editingKey = key;
  const [y, m] = key.split("-");
  const t = treks[key];
  $("#trekDialogTitle").textContent = `${y}년 ${Number(m)}월 트레킹`;
  trekForm.reset();
  trekForm.date.min = `${key}-01`;
  trekForm.date.max = `${key}-${pad(new Date(y, m, 0).getDate())}`;
  if (t) {
    trekForm.place.value = t.place;
    trekForm.date.value = t.date;
    trekForm.distance.value = t.distance || "";
    trekForm.level.value = t.level;
    trekForm.note.value = t.note || "";
  } else {
    trekForm.date.value = `${key}-01`;
  }
  $("#trekDelete").style.visibility = t ? "visible" : "hidden";
  dialog.showModal();
}

trekForm.addEventListener("submit", () => {
  const fd = new FormData(trekForm);
  treks[editingKey] = {
    place: fd.get("place").trim(),
    date: fd.get("date"),
    distance: fd.get("distance") ? parseFloat(fd.get("distance")) : null,
    level: fd.get("level"),
    note: fd.get("note").trim(),
  };
  store.set(TREK_KEY, treks);
  renderTreks();
});

$("#trekCancel").addEventListener("click", () => dialog.close());
$("#trekDelete").addEventListener("click", () => {
  if (!confirm("이 달의 트레킹 기록을 삭제할까요?")) return;
  delete treks[editingKey];
  store.set(TREK_KEY, treks);
  dialog.close();
  renderTreks();
});

$("#prevYear").addEventListener("click", () => { viewYear--; renderTreks(); });
$("#nextYear").addEventListener("click", () => { viewYear++; renderTreks(); });

// ===== 히어로 요약 =====
function renderHero() {
  const ym = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  $("#heroRuns").textContent = runs.filter((r) => r.date.startsWith(ym)).length;
  $("#heroKm").textContent = round1(runs.reduce((s, r) => s + r.distance, 0));
  $("#heroTreks").textContent = Object.keys(treks).filter((k) => k.startsWith(String(today.getFullYear()))).length;
}

// ===== 기타 =====
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 스크롤 등장 애니메이션
const observer = new IntersectionObserver(
  (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("visible")),
  { threshold: 0.1 }
);
document.querySelectorAll(".section").forEach((s) => {
  s.classList.add("reveal");
  observer.observe(s);
});

// 초기화
runForm.date.value = toISO(today);
$("#year").textContent = today.getFullYear();
renderRuns();
renderTreks();
