(() => {
  const root = document.documentElement;
  const THEME_KEY = "byka-theme";

  const getSavedTheme = () => {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch {
      return null;
    }
  };

  const applyTheme = (theme) => {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      const isDark = root.getAttribute("data-theme") === "dark";
      btn.textContent = isDark ? "DNEVNA SMJENA" : "NOĆNA SMJENA";
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    });
  };

  const initialTheme = getSavedTheme();
  if (initialTheme) {
    applyTheme(initialTheme);
  }

  const initNavigationAndTheme = () => {
    const currentFile =
      window.location.pathname.split("/").filter(Boolean).pop() || "index.html";

    document.querySelectorAll(".footer-nav").forEach((nav) => {
      nav.querySelectorAll("a").forEach((link) => {
        const hrefFile = link.getAttribute("href")?.split("/").pop();
        const cleanText = link.textContent.trim().replace(/^\[|\]$/g, "");
        if (hrefFile && hrefFile === currentFile) {
          link.setAttribute("aria-current", "page");
          link.textContent = `[${cleanText}]`;
        } else {
          link.removeAttribute("aria-current");
          link.textContent = cleanText;
        }
      });
    });

    document.querySelectorAll(".theme-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const next =
          root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          // ignore storage errors
        }
        applyTheme(next);
      });
    });

    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  };

  const initCustomScrollbar = () => {
    if (document.querySelector(".byka-scrollbar")) {
      return;
    }

    const isPostPage = Boolean(
      document.querySelector('link[href*="post.css"]') ||
        document.querySelector(".margin-title"),
    );

    if (isPostPage && !document.querySelector(".reading-progress")) {
      const progress = document.createElement("div");
      progress.className = "reading-progress";
      progress.setAttribute("aria-hidden", "true");
      const bar = document.createElement("div");
      bar.className = "reading-progress-bar";
      progress.appendChild(bar);
      document.body.prepend(progress);
    }

    const scrollbar = document.createElement("aside");
    scrollbar.className = "byka-scrollbar is-hidden";
    scrollbar.setAttribute("aria-hidden", "true");

    const topCap = document.createElement("span");
    topCap.className = "byka-scroll-cap";
    topCap.textContent = "00";

    const track = document.createElement("div");
    track.className = "byka-scroll-track";

    const rail = document.createElement("div");
    rail.className = "byka-scroll-rail";

    const fill = document.createElement("div");
    fill.className = "byka-scroll-fill";

    const ticksContainer = document.createElement("div");
    ticksContainer.className = "byka-scroll-ticks";

    const tickElements = [];
    const totalTicks = 20;
    for (let i = 0; i <= totalTicks; i += 1) {
      const pct = (i / totalTicks) * 100;
      const tick = document.createElement("span");
      tick.className =
        i % 5 === 0 ? "byka-scroll-tick is-major" : "byka-scroll-tick";
      tick.style.top = `${pct}%`;
      tick.dataset.pct = String(pct);
      ticksContainer.appendChild(tick);
      tickElements.push({ element: tick, pct });
    }

    const thumb = document.createElement("div");
    thumb.className = "byka-scroll-thumb";

    const readout = document.createElement("span");
    readout.className = "byka-scroll-readout";
    readout.textContent = "000%";

    const marker = document.createElement("span");
    marker.className = "byka-scroll-marker";

    thumb.append(readout, marker);
    track.append(rail, fill, ticksContainer, thumb);

    const bottomCap = document.createElement("span");
    bottomCap.className = "byka-scroll-cap";
    bottomCap.textContent = "99";

    scrollbar.append(topCap, track, bottomCap);
    document.body.appendChild(scrollbar);

    let scrollTimeout = null;
    let isDragging = false;

    const updateScrollState = () => {
      const scrollTop = window.scrollY || root.scrollTop || 0;
      const maxScroll = Math.max(
        0,
        root.scrollHeight - window.innerHeight,
      );

      if (maxScroll <= 2) {
        scrollbar.classList.add("is-hidden");
        root.style.setProperty("--scroll-pct", "0%");
        return;
      }

      scrollbar.classList.remove("is-hidden");
      const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
      const pct = ratio * 100;
      const rounded = Math.round(pct);

      root.style.setProperty("--scroll-pct", `${pct.toFixed(2)}%`);
      readout.textContent = `${String(rounded).padStart(3, "0")}%`;

      tickElements.forEach(({ element, pct: tickPct }) => {
        element.classList.toggle("is-passed", tickPct <= pct + 0.5);
      });
    };

    const flagScrolling = () => {
      scrollbar.classList.add("is-scrolling");
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollbar.classList.remove("is-scrolling");
      }, 700);
    };

    const scrollToTrackPosition = (clientY) => {
      const rect = track.getBoundingClientRect();
      if (rect.height <= 0) {
        return;
      }
      const ratio = Math.min(
        1,
        Math.max(0, (clientY - rect.top) / rect.height),
      );
      const maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
      window.scrollTo({
        top: ratio * maxScroll,
        behavior: "instant",
      });
      updateScrollState();
    };

    track.addEventListener("pointerdown", (event) => {
      isDragging = true;
      scrollbar.classList.add("is-dragging");
      track.setPointerCapture(event.pointerId);
      scrollToTrackPosition(event.clientY);
    });

    track.addEventListener("pointermove", (event) => {
      if (!isDragging) {
        return;
      }
      scrollToTrackPosition(event.clientY);
    });

    const stopDragging = (event) => {
      if (!isDragging) {
        return;
      }
      isDragging = false;
      scrollbar.classList.remove("is-dragging");
      if (event && track.hasPointerCapture?.(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }
    };

    track.addEventListener("pointerup", stopDragging);
    track.addEventListener("pointercancel", stopDragging);

    window.addEventListener(
      "scroll",
      () => {
        updateScrollState();
        flagScrolling();
      },
      { passive: true },
    );

    window.addEventListener("resize", updateScrollState, { passive: true });

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(updateScrollState);
      ro.observe(document.body);
    }

    updateScrollState();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initNavigationAndTheme();
      initCustomScrollbar();
    });
  } else {
    initNavigationAndTheme();
    initCustomScrollbar();
  }
})();
