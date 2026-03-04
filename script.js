/*
  Ray’s Tint — interactions
  Required behaviors:
  - Smooth scrolling with header offset
  - Header changes style on scroll
  - Gallery modal (open/close: click, overlay, Esc)
  - Form validation + success state (no network)
  - Subtle reveal animations (premium micro-motion)
*/

(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Header scroll state
  const onScroll = () => {
    const scrolled = window.scrollY > 10;
    header?.classList.toggle("is-scrolled", scrolled);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu toggle
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu.hidden = isOpen;
    });
  }

  // Smooth scroll with sticky header offset
  function getHeaderOffset() {
    return header ? header.getBoundingClientRect().height + 10 : 0;
  }

  function scrollToHash(hash) {
    const id = hash?.startsWith("#") ? hash.slice(1) : hash;
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    const y = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // Intercept internal anchor links
  document.addEventListener("click", (e) => {
    const link = e.target instanceof Element ? e.target.closest("a[href^='#']") : null;
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    e.preventDefault();

    // Close mobile menu if open
    if (navToggle && mobileMenu && navToggle.getAttribute("aria-expanded") === "true") {
      navToggle.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    }

    history.pushState(null, "", href);
    scrollToHash(href);
  });

  // If user lands with a hash, offset scroll after layout
  window.addEventListener("load", () => {
    if (location.hash) {
      setTimeout(() => scrollToHash(location.hash), 50);
    }
  });

  // Admin (soft version only): thumbnail framing controls
  const adminToggle = document.getElementById("adminToggle");
  const adminPanel = document.getElementById("adminPanel");
  const adminCropList = document.getElementById("adminCropList");
  const adminReset = document.getElementById("adminReset");
  const adminCopy = document.getElementById("adminCopy");
  const adminStatus = document.getElementById("adminStatus");
  const CROP_STORAGE_KEY = "raysTint.galleryCrop.v1";

  function setStatus(msg) {
    if (!adminStatus) return;
    adminStatus.textContent = msg || "";
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function parsePos(pos) {
    const fallback = { x: 50, y: 50 };
    if (!pos || typeof pos !== "string") return fallback;
    const parts = pos
      .trim()
      .split(/\s+/)
      .map((p) => p.replace("%", ""));
    if (parts.length < 2) return fallback;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return fallback;
    return { x: clamp(Math.round(x), 0, 100), y: clamp(Math.round(y), 0, 100) };
  }

  function formatPos(x, y) {
    return `${clamp(Math.round(x), 0, 100)}% ${clamp(Math.round(y), 0, 100)}%`;
  }

  function loadCropSettings() {
    try {
      const raw = window.localStorage.getItem(CROP_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function saveCropSettings(settings) {
    try {
      window.localStorage.setItem(CROP_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore quota/private-mode errors
    }
  }

  function applyThumbStyle(btn) {
    const thumb = btn.querySelector(".gallery-thumb");
    if (thumb instanceof HTMLImageElement) {
      const pos = btn.getAttribute("data-pos");
      const fit = btn.getAttribute("data-fit");
      if (pos) thumb.style.objectPosition = pos;
      if (fit) thumb.style.objectFit = fit;
    }
  }

  function getGalleryKey(btn) {
    return btn.getAttribute("data-src") || btn.getAttribute("data-title") || "";
  }

  function applyStoredCropToGallery() {
    const settings = loadCropSettings();
    document.querySelectorAll(".gallery-item").forEach((btn) => {
      const key = getGalleryKey(btn);
      const stored = key ? settings[key] : null;
      if (stored && typeof stored.pos === "string") {
        btn.setAttribute("data-pos", stored.pos);
      }
      if (stored && typeof stored.fit === "string") {
        btn.setAttribute("data-fit", stored.fit);
      }
      applyThumbStyle(btn);
    });
  }

  function openAdmin() {
    if (!adminPanel || !adminToggle) return;
    adminPanel.hidden = false;
    adminPanel.setAttribute("aria-hidden", "false");
    adminToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    setStatus("");
    buildAdminList();

    const closeBtn = adminPanel.querySelector("[data-admin-close='true']");
    if (closeBtn instanceof HTMLElement) closeBtn.focus();
  }

  function closeAdmin() {
    if (!adminPanel || !adminToggle) return;
    adminPanel.hidden = true;
    adminPanel.setAttribute("aria-hidden", "true");
    adminToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    setStatus("");
    adminCropList && (adminCropList.innerHTML = "");
    adminToggle.focus();
  }

  function buildAdminList() {
    if (!adminCropList) return;
    const settings = loadCropSettings();
    adminCropList.innerHTML = "";

    const items = Array.from(document.querySelectorAll(".gallery-item"));
    items.forEach((btn) => {
      const title = btn.getAttribute("data-title") || "Gallery item";
      const src = btn.getAttribute("data-src") || "";
      const key = getGalleryKey(btn);
      const basePos = btn.getAttribute("data-pos") || "50% 50%";
      const stored = key ? settings[key] : null;
      const pos = parsePos((stored && stored.pos) || basePos);

      const row = document.createElement("div");
      row.className = "admin-row";

      const top = document.createElement("div");
      top.className = "admin-row-top";

      const label = document.createElement("p");
      label.className = "admin-row-title";
      label.textContent = title;

      const meta = document.createElement("p");
      meta.className = "muted admin-row-src";
      meta.textContent = src.replace(/^.*[\\/]/, "");

      top.appendChild(label);
      top.appendChild(meta);

      const controls = document.createElement("div");
      controls.className = "admin-controls";

      const xControl = document.createElement("div");
      xControl.className = "admin-control";
      const xLabel = document.createElement("label");
      const xId = `cropx-${Math.random().toString(16).slice(2)}`;
      xLabel.setAttribute("for", xId);
      xLabel.textContent = "X";
      const xRange = document.createElement("input");
      xRange.type = "range";
      xRange.min = "0";
      xRange.max = "100";
      xRange.value = String(pos.x);
      xRange.id = xId;
      const xVal = document.createElement("span");
      xVal.className = "admin-value";
      xVal.textContent = `${pos.x}%`;
      xControl.appendChild(xLabel);
      xControl.appendChild(xRange);
      xControl.appendChild(xVal);

      const yControl = document.createElement("div");
      yControl.className = "admin-control";
      const yLabel = document.createElement("label");
      const yId = `cropy-${Math.random().toString(16).slice(2)}`;
      yLabel.setAttribute("for", yId);
      yLabel.textContent = "Y";
      const yRange = document.createElement("input");
      yRange.type = "range";
      yRange.min = "0";
      yRange.max = "100";
      yRange.value = String(pos.y);
      yRange.id = yId;
      const yVal = document.createElement("span");
      yVal.className = "admin-value";
      yVal.textContent = `${pos.y}%`;
      yControl.appendChild(yLabel);
      yControl.appendChild(yRange);
      yControl.appendChild(yVal);

      const applyNow = () => {
        const nx = clamp(Number(xRange.value), 0, 100);
        const ny = clamp(Number(yRange.value), 0, 100);
        xVal.textContent = `${nx}%`;
        yVal.textContent = `${ny}%`;
        const posStr = formatPos(nx, ny);
        btn.setAttribute("data-pos", posStr);
        applyThumbStyle(btn);

        const nextSettings = loadCropSettings();
        if (key) {
          nextSettings[key] = { ...(nextSettings[key] || {}), pos: posStr };
          saveCropSettings(nextSettings);
        }
      };

      xRange.addEventListener("input", applyNow);
      yRange.addEventListener("input", applyNow);

      controls.appendChild(xControl);
      controls.appendChild(yControl);

      row.appendChild(top);
      row.appendChild(controls);
      adminCropList.appendChild(row);
    });
  }

  // Apply any saved crop first
  applyStoredCropToGallery();

  document.querySelectorAll(".gallery-item").forEach((btn) => applyThumbStyle(btn));

  if (adminToggle && adminPanel) {
    adminToggle.addEventListener("click", () => {
      const isOpen = adminToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeAdmin();
      else openAdmin();
    });

    adminPanel.addEventListener("click", (e) => {
      const el = e.target instanceof Element ? e.target : null;
      if (!el) return;
      if (el.matches("[data-admin-close='true']")) closeAdmin();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && adminPanel && !adminPanel.hidden) closeAdmin();
    });
  }

  if (adminReset) {
    adminReset.addEventListener("click", () => {
      try {
        window.localStorage.removeItem(CROP_STORAGE_KEY);
      } catch {
        // ignore
      }
      applyStoredCropToGallery();
      buildAdminList();
      setStatus("Reset to defaults.");
    });
  }

  if (adminCopy) {
    adminCopy.addEventListener("click", async () => {
      const payload = loadCropSettings();
      const text = JSON.stringify(payload, null, 2);
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          setStatus("Copied settings to clipboard.");
          return;
        }
      } catch {
        // fall through
      }
      setStatus("Copy not available in this browser.");
    });
  }

  // Quote form validation + success state
  const form = document.getElementById("quoteForm");
  const successPanel = document.getElementById("successPanel");
  const newRequestBtn = document.getElementById("newRequestBtn");

  // Quote wizard (mobile-first)
  const stepButtons = Array.from(document.querySelectorAll("[data-step-btn]"));
  const stepNextBtn = document.querySelector("[data-step-next]");
  const stepBackBtn = document.querySelector("[data-step-back]");
  const step2El = form ? form.querySelector(".form-step[data-step='2']") : null;

  function setStep(step) {
    if (!form) return;
    const next = String(step === 2 ? 2 : 1);
    form.setAttribute("data-step", next);

    stepButtons.forEach((btn) => {
      const s = btn.getAttribute("data-step-btn");
      if (s === next) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
    });
  }

  function scrollToStep2() {
    if (!step2El) return;
    const headerOffset = getHeaderOffset();
    const y = step2El.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  stepButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = Number(btn.getAttribute("data-step-btn"));
      if (step === 2) {
        // Don’t allow jumping to step 2 if step 1 is invalid
        if (form && !validate(form, { scrollOnError: true })) return;
        setStep(2);
        scrollToStep2();
        return;
      }
      setStep(1);
      // Scroll to top of quote card for step 1
      const shell = document.querySelector("#quote");
      if (shell) {
        const y = shell.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  });

  // Soft calendar (UI-only)
  const calDays = document.getElementById("calDays");
  const calSlots = document.getElementById("calSlots");
  const appointmentDay = document.getElementById("appointmentDay");
  const appointmentTime = document.getElementById("appointmentTime");

  const SLOT_LABELS = [
    { time: "9:00 AM", note: "Morning" },
    { time: "10:30 AM", note: "Morning" },
    { time: "12:00 PM", note: "Midday" },
    { time: "1:30 PM", note: "Midday" },
    { time: "3:00 PM", note: "Afternoon" },
    { time: "4:30 PM", note: "Afternoon" },
  ];

  // Demo-only availability simulation (no backend)
  let selectedDateKey = "";
  const bookedByDay = new Map();

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function uniqueIndices(seed, count, modulo) {
    const out = new Set();
    let x = seed || 1;
    while (out.size < count) {
      // xorshift32
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      out.add(Math.abs(x) % modulo);
    }
    return Array.from(out);
  }

  function getBookedSlotsForDay(dateKey) {
    if (!dateKey) return [];
    if (bookedByDay.has(dateKey)) return bookedByDay.get(dateKey);

    const seed = hashString(dateKey);
    // 1–3 booked slots per day, deterministic
    const bookedCount = 1 + (seed % 3);
    const idx = uniqueIndices(seed, bookedCount, SLOT_LABELS.length);
    const booked = idx.map((i) => SLOT_LABELS[i].time);

    bookedByDay.set(dateKey, booked);
    return booked;
  }

  function formatDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDow(d) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }

  function formatMonthDay(d) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function clearSelected(container, selector) {
    if (!container) return;
    container.querySelectorAll(selector).forEach((el) => {
      el.setAttribute("aria-selected", "false");
    });
  }

  function renderDays() {
    if (!calDays) return;

    const now = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      days.push(d);
    }

    calDays.innerHTML = "";
    for (const d of days) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-day";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      const dateKey = formatDateKey(d);
      btn.dataset.dateKey = dateKey;

      const isToday = dateKey === formatDateKey(now);
      const booked = getBookedSlotsForDay(dateKey);
      const openCount = Math.max(0, SLOT_LABELS.length - booked.length);
      btn.innerHTML = `
        <span class="cal-day-top">
          <span class="cal-day-dow">${formatDow(d)}</span>
          <span class="cal-day-date">${formatMonthDay(d)}</span>
        </span>
        <span class="cal-day-sub">${isToday ? "Today" : `${openCount} open`}</span>
      `;

      btn.addEventListener("click", () => {
        clearSelected(calDays, ".cal-day");
        btn.setAttribute("aria-selected", "true");
        selectedDateKey = btn.dataset.dateKey || "";
        if (appointmentDay) appointmentDay.value = selectedDateKey;
        // Day drives availability: clear time selection when switching days
        if (appointmentTime) appointmentTime.value = "";
        clearSelected(calSlots, ".cal-slot");
        renderSlots();
      });

      calDays.appendChild(btn);
    }

    // Select today by default for a more realistic demo
    const first = calDays.querySelector(".cal-day");
    if (first && first instanceof HTMLElement) {
      const todayKey = formatDateKey(now);
      const todayBtn = calDays.querySelector(`.cal-day[data-date-key='${todayKey}']`);
      const pick = todayBtn instanceof HTMLElement ? todayBtn : first;
      pick.click();
    }
  }

  function renderSlots() {
    if (!calSlots) return;
    calSlots.innerHTML = "";

    const booked = new Set(getBookedSlotsForDay(selectedDateKey));

    for (const slot of SLOT_LABELS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal-slot";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", "false");
      btn.dataset.time = slot.time;

      const isBooked = booked.has(slot.time);
      if (isBooked) {
        btn.classList.add("is-booked");
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
      }

      btn.innerHTML = `${slot.time}<span class="cal-slot-sub">${isBooked ? "Booked" : slot.note}</span>`;

      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        clearSelected(calSlots, ".cal-slot");
        btn.setAttribute("aria-selected", "true");
        if (appointmentTime) appointmentTime.value = slot.time;
      });

      calSlots.appendChild(btn);
    }
  }

  function resetCalendar() {
    if (appointmentDay) appointmentDay.value = "";
    if (appointmentTime) appointmentTime.value = "";
    selectedDateKey = "";
    clearSelected(calDays, ".cal-day");
    clearSelected(calSlots, ".cal-slot");
  }

  // Init calendar if present
  if (calDays && calSlots) {
    renderDays();
    // renderSlots() is triggered by the default day selection in renderDays()
  }

  function setError(name, message) {
    const el = document.querySelector(`.error[data-for='${name}']`);
    if (el) el.textContent = message || "";
  }

  function scrollToEl(el) {
    if (!(el instanceof Element)) return;
    const headerOffset = getHeaderOffset();
    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset - 6;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function focusAndScrollToFirstError(formEl) {
    const priority = [
      { name: "name", selector: "#name" },
      { name: "phone", selector: "#phone" },
      { name: "email", selector: "#email" },
      { name: "zip", selector: "#zip" },
      { name: "vehicle", selector: "#vehicle" },
      { name: "serviceType", selector: "input[name='serviceType']" },
    ];

    for (const item of priority) {
      const err = formEl.querySelector(`.error[data-for='${item.name}']`);
      if (!err) continue;
      if (!String(err.textContent || "").trim()) continue;

      let focusTarget = formEl.querySelector(item.selector);
      let scrollTarget = focusTarget;

      if (item.name === "serviceType") {
        const anchor = err.closest(".field") || err.closest("fieldset") || err;
        scrollTarget = anchor;
        focusTarget = formEl.querySelector("input[name='serviceType']");
      }

      const step = scrollTarget?.closest(".form-step")?.getAttribute("data-step");
      if (step === "1") setStep(1);

      if (focusTarget instanceof HTMLElement) {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch {
          focusTarget.focus();
        }
      }

      if (scrollTarget) scrollToEl(scrollTarget);
      return;
    }
  }

  function normalizePhone(value) {
    return (value || "").replace(/\D/g, "");
  }

  function validate(formEl, opts) {
    const scrollOnError = Boolean(opts && opts.scrollOnError);
    const fd = new FormData(formEl);

    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const zip = String(fd.get("zip") || "").trim();
    const vehicle = String(fd.get("vehicle") || "").trim();
    const serviceTypes = (fd.getAll("serviceType") || []).map((v) => String(v || "").trim()).filter(Boolean);

    // Clear previous errors
    ["name", "phone", "email", "zip", "vehicle", "serviceType"].forEach((k) => setError(k, ""));

    let ok = true;

    if (!name) {
      setError("name", "Please enter your name.");
      ok = false;
    }

    const hasPhone = normalizePhone(phone).length > 0;
    const hasEmail = email.length > 0;

    if (!hasPhone && !hasEmail) {
      setError("phone", "Add a phone or email so we can reply.");
      setError("email", "Add a phone or email so we can reply.");
      ok = false;
    }

    if (hasPhone) {
      const digits = normalizePhone(phone);
      if (digits.length < 10) {
        setError("phone", "Please enter a valid phone number.");
        ok = false;
      }
    }

    if (hasEmail) {
      // Minimal email check (HTML input type=email also helps)
      const looksOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!looksOk) {
        setError("email", "Please enter a valid email address.");
        ok = false;
      }
    }

    if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
      setError("zip", "Please enter a valid ZIP.");
      ok = false;
    }

    if (!vehicle) {
      setError("vehicle", "Please enter your vehicle.");
      ok = false;
    }

    if (!serviceTypes.length) {
      setError("serviceType", "Pick at least one service.");
      ok = false;
    }

    if (!ok && scrollOnError) focusAndScrollToFirstError(formEl);
    return ok;
  }

  function showSuccess() {
    if (!form || !successPanel) return;
    form.hidden = true;
    successPanel.hidden = false;

    const h = successPanel.querySelector("h3");
    if (h instanceof HTMLElement) h.focus?.();
  }

  function resetForm() {
    if (!form || !successPanel) return;
    form.reset();
    form.hidden = false;
    successPanel.hidden = true;

    ["name", "phone", "email", "zip", "vehicle", "serviceType"].forEach((k) => setError(k, ""));
    resetCalendar();

    setStep(1);

    const first = form.querySelector("input, select, textarea");
    if (first instanceof HTMLElement) first.focus();
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate(form, { scrollOnError: true })) return;
      showSuccess();
    });

    // Light inline validation on blur
    form.addEventListener(
      "blur",
      () => {
        // don’t aggressively validate every field; keep it subtle
      },
      true
    );
  }

  if (stepNextBtn) {
    stepNextBtn.addEventListener("click", () => {
      if (!form) return;
      if (!validate(form, { scrollOnError: true })) return;
      setStep(2);
      scrollToStep2();
    });
  }

  if (stepBackBtn) {
    stepBackBtn.addEventListener("click", () => {
      setStep(1);
      const shell = document.querySelector("#quote");
      if (shell) {
        const y = shell.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  }

  if (newRequestBtn) {
    newRequestBtn.addEventListener("click", resetForm);
  }

  // Subtle on-scroll reveal + Performance Panel animation
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced && "IntersectionObserver" in window) {
    const targets = Array.from(document.querySelectorAll("[data-reveal], [data-perf]"));
    if (targets.length) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            el.classList.add("in-view");
            obs.unobserve(el);
          }
        },
        { threshold: 0.18 }
      );

      targets.forEach((el) => io.observe(el));
    }
  } else {
    // No motion / no IO: ensure content is visible
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("in-view"));
    document.querySelectorAll("[data-perf]").forEach((el) => el.classList.add("in-view"));
  }
})();
