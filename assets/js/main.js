/* ============================================================
   PT DAI — main.js
   Shared behavior for index.html and dairental.html
   ============================================================ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    detectBackdropSupport();
    setupNavbarScroll();
    setupActiveNavOnScroll();
    setupMobileNavAutoClose();
    setupServicePortfolioCarousels();
    setupStatCounters();
    setupMarqueeDuplication();
    setupRentalLeadForm();
    setupYear();
  }

  /* ---- backdrop-filter fallback ---- */
  function detectBackdropSupport() {
    var supports =
      window.CSS &&
      CSS.supports &&
      (CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)"));
    if (!supports) document.body.classList.add("no-backdrop");
  }

  /* ---- Navbar solid state on scroll ---- */
  function setupNavbarScroll() {
    var nav = document.querySelector(".dai-nav");
    if (!nav) return;

    function update() {
      if (window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---- Close mobile menu after clicking a link ---- */
  function setupMobileNavAutoClose() {
    var collapseEl = document.getElementById("navbarNav");
    if (!collapseEl || !window.bootstrap) return;
    var bsCollapse = null;
    collapseEl.querySelectorAll("a.nav-link, a.btn-cta, a.btn-mobile-quote").forEach(function (link) {
      link.addEventListener("click", function () {
        if (collapseEl.classList.contains("show")) {
          bsCollapse = window.bootstrap.Collapse.getOrCreateInstance(collapseEl);
          bsCollapse.hide();
        }
      });
    });
  }

  /* ---- Keep nav link state in sync with current section ---- */
  function setupActiveNavOnScroll() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".dai-nav .nav-link[href^='#']"));
    if (!navLinks.length) return;

    var sectionMap = navLinks
      .map(function (link) {
        var id = link.getAttribute("href");
        var section = id ? document.querySelector(id) : null;
        return section ? { link: link, section: section } : null;
      })
      .filter(Boolean);

    if (!sectionMap.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          sectionMap.forEach(function (item) {
            item.link.classList.toggle("active", item.section === entry.target);
          });
        });
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0.01,
      }
    );

    sectionMap.forEach(function (item) {
      observer.observe(item.section);
    });
  }

  /* ---- Add controls and interaction handling for service carousels ---- */
  function setupServicePortfolioCarousels() {
    if (!window.bootstrap) return;

    var sliders = document.querySelectorAll(".portfolio-service-slider.carousel");
    if (!sliders.length) return;

    sliders.forEach(function (slider) {
      if (!slider.id) return;

      slider.setAttribute("data-bs-pause", "hover");
      slider.setAttribute("data-bs-touch", "true");

      if (!slider.querySelector(".carousel-control-prev")) {
        slider.insertAdjacentHTML(
          "beforeend",
          '<button class="carousel-control-prev portfolio-service-control" type="button" data-bs-target="#' +
            slider.id +
            '" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span></button>'
        );
      }

      if (!slider.querySelector(".carousel-control-next")) {
        slider.insertAdjacentHTML(
          "beforeend",
          '<button class="carousel-control-next portfolio-service-control" type="button" data-bs-target="#' +
            slider.id +
            '" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span></button>'
        );
      }

      var carousel = window.bootstrap.Carousel.getOrCreateInstance(slider);
      slider.addEventListener("mouseenter", function () {
        carousel.pause();
      });
      slider.addEventListener("mouseleave", function () {
        carousel.cycle();
      });
    });
  }

  /* ---- Animated count-up for stat numbers ---- */
  function setupStatCounters() {
    var nums = document.querySelectorAll("[data-count-to]");
    if (!nums.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    nums.forEach(function (el) {
      observer.observe(el);
    });

    function animateCount(el) {
      var target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1100;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }
  }

  /* ---- Duplicate marquee tracks so the CSS loop has no gap ---- */
  function setupMarqueeDuplication() {
    document.querySelectorAll(".scroll-track, .ticker-track").forEach(function (track) {
      if (track.dataset.duplicated) return;
      var clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.parentNode.appendChild(clone);
      track.dataset.duplicated = "true";
    });
  }

  /* ---- Send rental lead form details to WhatsApp ---- */
  function setupRentalLeadForm() {
    var form = document.getElementById("rentalLeadForm");
    if (!form) return;

    var statusEl = document.getElementById("rentalFormStatus");
    var waNumber = "628112455999";

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        if (statusEl) {
          statusEl.textContent = "Mohon lengkapi data wajib sebelum mengirim.";
        }
        return;
      }

      var formData = new FormData(form);
      var durationValue = (formData.get("leadDurationValue") || "").toString().trim();
      var durationScheme = (formData.get("leadDuration") || "").toString().trim();
      var durationText = "-";

      if (durationValue && durationScheme) {
        durationText = durationValue + " " + durationScheme;
      } else if (durationValue) {
        durationText = durationValue;
      } else if (durationScheme) {
        durationText = durationScheme;
      }

      var lines = [
        "Halo DAI Rental, saya ingin request penawaran:",
        "",
        "Nama PIC: " + (formData.get("leadName") || "-"),
        "Perusahaan: " + (formData.get("leadCompany") || "-"),
        "Perangkat: " + (formData.get("leadDevice") || "-"),
        "Jumlah unit: " + (formData.get("leadQty") || "-"),
        "Durasi sewa: " + durationText,
        "Mulai dibutuhkan: " + (formData.get("leadStartDate") || "-"),
        "Catatan: " + (formData.get("leadNotes") || "-")
      ];

      var message = encodeURIComponent(lines.join("\n"));
      var waUrl = "https://wa.me/" + waNumber + "?text=" + message;

      if (statusEl) {
        statusEl.textContent = "Mengarahkan ke WhatsApp...";
      }

      window.open(waUrl, "_blank", "noopener");
    });
  }

  /* ---- Footer year ---- */
  function setupYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

})();
