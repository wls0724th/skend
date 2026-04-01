(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const scanSection = document.querySelector(".scan-section");
    const scanTrack = document.querySelector(".scan-section .scan-track");
    const sharpImage = document.querySelector(".scan-section .image.sharp");
    const titleBlock = document.querySelector(".scan-section .title");
    const header = document.querySelector(".header");
    const headerLogo = document.querySelector(".header .logo");

    /** 상단 배너(40px) 아래 고정 헤더 영역과 겹치는 블록의 data-header-theme */
    const HEADER_BAND_TOP = 40;
    const HEADER_BAND_BOTTOM = 120;

    function headerThemeFromScroll() {
      const themed = document.querySelectorAll("[data-header-theme]");
      let best = "dark";
      let bestOverlap = 0;
      for (const el of themed) {
        const r = el.getBoundingClientRect();
        const overlap = Math.max(
          0,
          Math.min(r.bottom, HEADER_BAND_BOTTOM) -
            Math.max(r.top, HEADER_BAND_TOP),
        );
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          best = el.dataset.headerTheme || "dark";
        }
      }
      return best === "light" ? "light" : "dark";
    }

    function updateHeaderContrast() {
      if (!header) return;
      const theme = headerThemeFromScroll();
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

    const scanReady = scanSection && scanTrack && sharpImage;

    function updateScroll() {
      if (scanReady) {
        const scrollY = window.scrollY;
        const winH = window.innerHeight;

        const scanProgress = clamp(
          (scrollY - scanSection.offsetTop) / (scanSection.offsetHeight - winH),
        );
        const pct = scanProgress * 100;

        scanTrack.style.width = pct + "%";

        sharpImage.style.maskImage = `linear-gradient(to right, black ${pct}%, transparent ${pct}%)`;
        sharpImage.style.webkitMaskImage = sharpImage.style.maskImage;

        if (titleBlock) {
          titleBlock.style.opacity = String(0.3 + scanProgress * 0.7);
        }
      }

      updateHeaderContrast();
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

    window.addEventListener("scroll", onScroll, {passive: true});
    window.addEventListener("resize", updateScroll);
    updateScroll();
  });
})();
