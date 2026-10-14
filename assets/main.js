/* ==========================================================
   ✏️ 여기만 수정하면 페이지 전체에 반영돼요
   ========================================================== */
const PROFILE = {
  name: "이름",                 // 예: "안수빈"
  brand: "슬로우 라이프",        // 로고에 표시될 이름
  instagram: "your_instagram",  // 인스타그램 아이디 (@ 없이)
  threads: "your_threads",      // 스레드 아이디 (@ 없이)
  blogName: "블로그 이름",
  blogUrl: "https://blog.naver.com/your_blog",
  kakaoUrl: "https://open.kakao.com/o/your_link", // 카카오톡 오픈채팅 링크
  email: "hello@example.com",
};

/* ========================================================== */

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/* ── 프로필 정보 반영 ── */
const links = {
  instagram: `https://www.instagram.com/${PROFILE.instagram}/`,
  threads: `https://www.threads.net/@${PROFILE.threads}`,
  blog: PROFILE.blogUrl,
  kakao: PROFILE.kakaoUrl,
  email: `mailto:${PROFILE.email}`,
};
const binds = {
  name: PROFILE.name,
  brand: PROFILE.brand,
  instagramHandle: `@${PROFILE.instagram}`,
  threadsHandle: `@${PROFILE.threads}`,
  blogName: PROFILE.blogName,
  email: PROFILE.email,
};
$$("[data-link]").forEach((a) => (a.href = links[a.dataset.link]));
$$("[data-bind]").forEach((el) => (el.textContent = binds[el.dataset.bind]));
$("#year").textContent = new Date().getFullYear();

/* ── 프로필 사진: 없으면 이모지로 대체 ── */
const profileImg = $("#profileImg");
profileImg.addEventListener("error", () => profileImg.remove());

/* ── 테마 전환 (라이트/다크) ── */
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch {}
$("#themeBtn").addEventListener("click", () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = isDark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch {}
});

/* ── 모바일 메뉴 ── */
const navToggle = $("#navToggle");
const navLinks = $("#navLinks");
const setMenu = (open) => {
  navLinks.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
};
navToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
$$("a", navLinks).forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ── 스크롤: 헤더 그림자, 맨 위로 버튼 ── */
const nav = $("#nav");
const toTop = $("#toTop");
const onScroll = () => {
  nav.classList.toggle("scrolled", scrollY > 10);
  toTop.classList.toggle("show", scrollY > 600);
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

/* ── 스크롤 등장 애니메이션 + 숫자 카운트 ── */
const countUp = (el) => {
  const to = Number(el.dataset.to);
  const start = performance.now();
  const dur = 1400;
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * eased).toLocaleString("ko-KR");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$(".count", e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    io.observe(el);
  });
} else {
  $$(".reveal").forEach((el) => el.classList.add("in"));
  $$(".count").forEach((el) => (el.textContent = el.dataset.to));
}

/* ── 프로그램 탭 ── */
const tabs = $$(".tab");
const activateTab = (tab) => {
  tabs.forEach((t) => {
    const on = t === tab;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", on);
    $("#" + t.dataset.tab).hidden = !on;
  });
};
tabs.forEach((t, i) => {
  t.addEventListener("click", () => activateTab(t));
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    next.focus();
    activateTab(next);
  });
});

/* ── FAQ: 하나 열면 나머지는 닫기 ── */
$$(".faq details").forEach((d) =>
  d.addEventListener("toggle", () => {
    if (d.open) $$(".faq details").forEach((o) => o !== d && (o.open = false));
  })
);

/* ── 토스트 알림 ── */
let toastTimer;
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/* ── "문의" 버튼 → 관심 분야 자동 체크 ── */
$$("[data-interest]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const box = $(`#interestChips input[value="${btn.dataset.interest}"]`);
    if (box) box.checked = true;
  })
);

/* ── 링크 복사 ── */
$("#copyLink").addEventListener("click", async () => {
  const ok = await copyText(location.href.split("#")[0]);
  toast(ok ? "링크를 복사했어요! 프로필에 붙여넣어 보세요 🔗" : "복사에 실패했어요. 주소창의 링크를 사용해 주세요.");
});

/* ── 문의 폼 → 메일 작성 + 클립보드 복사 ── */
const form = $("#contactForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = data.get("name").trim();
  const reach = data.get("reach").trim();
  const interests = data.getAll("interest");
  const message = data.get("message").trim();

  let valid = true;
  ["name", "reach"].forEach((key) => {
    const input = form.elements[key];
    const bad = !input.value.trim();
    input.classList.toggle("invalid", bad);
    if (bad) valid = false;
  });
  if (!valid) {
    toast("이름과 연락처를 입력해 주세요 🙏");
    return;
  }

  const body = [
    `이름: ${name}`,
    `연락처: ${reach}`,
    `관심 분야: ${interests.length ? interests.join(", ") : "-"}`,
    "",
    message || "(내용 없음)",
  ].join("\n");
  const subject = `[문의] ${interests[0] || "상담"} - ${name}`;

  await copyText(body);
  location.href = `mailto:${PROFILE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  toast("메일 앱을 열었어요. 내용은 클립보드에도 복사됐어요 ✉️");
  form.reset();
});

$$("input[name=name], input[name=reach]", form).forEach((i) =>
  i.addEventListener("input", () => i.classList.remove("invalid"))
);
