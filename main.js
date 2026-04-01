(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const scanSection = document.querySelector(".scan-section");
    const scanTrack = document.querySelector(".scan-section .scan-track");
    const sharpImage = document.querySelector(".scan-section .image.sharp");
    const titleBlock = document.querySelector(".scan-section .title");
    const header = document.querySelector(".header");
    const headerLogo = document.querySelector(".header .logo");

    /** 뷰포트 Y 기준: 상단 배너(40px) 아래 ~ 헤더 하단(120px) */
    const HEADER_BAND_TOP = 40;
    const HEADER_BAND_BOTTOM = 120;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let themedSections = [];
    let scanTop = 0;
    let scanRange = 1;
    let winH = window.innerHeight;
    let lastHeaderTheme = null;
    let lastScanProgress = -1;
    let lastTitleOpacity = -1;

    function measureLayout() {
      winH = window.innerHeight;
      themedSections = [];

      for (const el of document.querySelectorAll("[data-header-theme]")) {
        const r = el.getBoundingClientRect();
        themedSections.push({
          theme: el.dataset.headerTheme === "light" ? "light" : "dark",
          absTop: r.top + window.scrollY,
          height: r.height,
        });
      }

      if (scanSection) {
        const sr = scanSection.getBoundingClientRect();
        scanTop = sr.top + window.scrollY;
        scanRange = Math.max(1, scanSection.offsetHeight - winH);
      }
    }

    function headerThemeFromScroll(scrollY) {
      let best = "dark";
      let bestOverlap = 0;
      for (const s of themedSections) {
        const topVp = s.absTop - scrollY;
        const botVp = topVp + s.height;
        const overlap = Math.max(
          0,
          Math.min(botVp, HEADER_BAND_BOTTOM) -
            Math.max(topVp, HEADER_BAND_TOP),
        );
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          best = s.theme;
        }
      }
      return best;
    }

    function applyHeaderTheme(theme) {
      if (!header || theme === lastHeaderTheme) return;
      lastHeaderTheme = theme;
      const onLight = theme === "light";
      header.classList.toggle("header--on-light", onLight);
      if (headerLogo) {
        const darkSrc = headerLogo.dataset.logoDark;
        const lightSrc = headerLogo.dataset.logoLight;
        if (darkSrc && lightSrc) {
          headerLogo.src = onLight ? lightSrc : darkSrc;
        }
      }
    }

    function clamp(v, lo = 0, hi = 1) {
      return Math.max(lo, Math.min(hi, v));
    }

    const scanReady = Boolean(scanSection && scanTrack && sharpImage);

    const SCAN_EPS = 0.004;
    const TITLE_OPACITY_EPS = 0.02;

    function updateScroll() {
      const scrollY = window.scrollY;

      applyHeaderTheme(headerThemeFromScroll(scrollY));

      if (!scanReady) return;

      if (reduceMotion) {
        if (lastScanProgress !== 1) {
          lastScanProgress = 1;
          scanTrack.style.transform = "scale3d(1, 1, 1)";
          sharpImage.style.setProperty("--scan-pct", "100%");
        }
        if (titleBlock && lastTitleOpacity !== 1) {
          lastTitleOpacity = 1;
          titleBlock.style.opacity = "1";
        }
        return;
      }

      const scanProgress = clamp((scrollY - scanTop) / scanRange);

      if (
        lastScanProgress < 0 ||
        Math.abs(scanProgress - lastScanProgress) >= SCAN_EPS
      ) {
        lastScanProgress = scanProgress;
        scanTrack.style.transform = `scale3d(${scanProgress}, 1, 1)`;
        sharpImage.style.setProperty("--scan-pct", `${scanProgress * 100}%`);
      }

      if (titleBlock) {
        const op = 0.3 + scanProgress * 0.7;
        if (
          lastTitleOpacity < 0 ||
          Math.abs(op - lastTitleOpacity) >= TITLE_OPACITY_EPS
        ) {
          lastTitleOpacity = op;
          titleBlock.style.opacity = String(op);
        }
      }
    }

    let ticking = false;
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    function onLayoutChange() {
      lastHeaderTheme = null;
      lastScanProgress = -1;
      lastTitleOpacity = -1;
      measureLayout();
      updateScroll();
    }

    let resizeRaf = 0;
    function scheduleLayoutChange() {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        onLayoutChange();
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleLayoutChange);

    const mainEl = document.querySelector("main");
    if (mainEl && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(scheduleLayoutChange);
      ro.observe(mainEl);
    }

    measureLayout();
    updateScroll();
  });
})();
