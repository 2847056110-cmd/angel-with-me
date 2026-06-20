(function () {
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var smallScreen = window.matchMedia("(max-width: 767px)");
  var coarsePointer = window.matchMedia("(pointer: coarse)");
  var passiveEvent = { passive: true };
  var qs = function (selector, scope) { return (scope || document).querySelector(selector); };
  var qsa = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };
  var nowTime = function () {
    return window.performance && window.performance.now ? window.performance.now() : Date.now();
  };

  function allowPointerFx() {
    return !reduceMotion && !smallScreen.matches && !coarsePointer.matches;
  }

  function throttle(fn, wait) {
    var timeout = 0;
    var lastRun = 0;
    var latestArgs;
    var latestThis;

    return function () {
      latestArgs = arguments;
      latestThis = this;
      var elapsed = nowTime() - lastRun;
      var delay = Math.max(0, wait - elapsed);

      if (!lastRun || delay === 0) {
        if (timeout) {
          window.clearTimeout(timeout);
          timeout = 0;
        }
        lastRun = nowTime();
        fn.apply(latestThis, latestArgs);
        return;
      }

      if (!timeout) {
        timeout = window.setTimeout(function () {
          timeout = 0;
          lastRun = nowTime();
          fn.apply(latestThis, latestArgs);
        }, delay);
      }
    };
  }

  function throttlePointer(fn, wait) {
    var locked = false;
    var lastRun = 0;
    var latestEvent = null;

    return function (event) {
      latestEvent = { clientX: event.clientX, clientY: event.clientY };
      if (locked) return;

      var elapsed = nowTime() - lastRun;
      var delay = !lastRun ? 0 : Math.max(0, wait - elapsed);
      locked = true;

      window.setTimeout(function () {
        window.requestAnimationFrame(function (stamp) {
          locked = false;
          lastRun = stamp || nowTime();
          if (latestEvent) fn(latestEvent);
        });
      }, delay);
    };
  }

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  body.classList.add("has-cover");

  if (!reduceMotion) {
    body.classList.add("is-animated");
  }

  qsa(".hero .reveal").forEach(function (item) {
    item.classList.add("is-visible");
  });

  var menuToggle = qs(".menu-toggle");
  var navLinks = qsa(".quick-nav a");

  function setMenu(open) {
    body.classList.toggle("nav-open", open);
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function () {
      setMenu(!body.classList.contains("nav-open"));
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      enterSite();
      setMenu(false);
    });
  });

  function enterSite(targetSelector, instant) {
    if (!body.classList.contains("is-entered")) {
      body.classList.add("is-entered");
      qsa(".folio-section .reveal, .portfolio-section .reveal, .closing .reveal").forEach(function (item, index) {
        window.setTimeout(function () {
          item.classList.add("is-visible");
        }, Math.min(index * 34, 360));
      });
    }

    if (targetSelector) {
      var target = qs(targetSelector);
      if (target) {
        var scrollToTarget = function (behavior) {
          var top = target.getBoundingClientRect().top + window.pageYOffset - 108;
          window.scrollTo({ top: Math.max(0, top), behavior: behavior });
        };
        window.setTimeout(function () {
          scrollToTarget(reduceMotion || instant ? "auto" : "smooth");
        }, instant ? 120 : reduceMotion ? 0 : 220);
        window.setTimeout(function () {
          scrollToTarget("auto");
        }, instant ? 920 : 1180);
        window.setTimeout(function () {
          scrollToTarget("auto");
        }, instant ? 1600 : 1700);
      }
    }
  }

  qsa("[data-enter-site]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      enterSite(trigger.dataset.scrollTarget || "");
    });
  });

  qsa('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var href = link.getAttribute("href");
      if (href && href !== "#top" && href !== "#oracle") {
        enterSite();
      }
    });
  });

  if (window.location.hash && window.location.hash !== "#top" && window.location.hash !== "#oracle") {
    enterSite(window.location.hash, true);
  }

  var viewer = qs(".viewer");
  var viewerImg = qs(".viewer__img");
  var viewerTitle = qs(".viewer__title");
  var viewerText = qs(".viewer__text");
  var closeButton = qs(".viewer__close");
  var prevButton = qs(".viewer__nav--prev");
  var nextButton = qs(".viewer__nav--next");
  var viewButtons = qsa("[data-view]");
  var activeIndex = 0;

  function readViewerButton(button) {
    if (!button || !viewerImg) return;
    viewerImg.src = button.dataset.src || "";
    viewerImg.alt = button.dataset.title || "";
    if (viewerTitle) viewerTitle.textContent = button.dataset.title || "";
    if (viewerText) viewerText.textContent = button.dataset.text || "";
  }

  function openViewer(button) {
    if (!viewer) return;
    activeIndex = Math.max(0, viewButtons.indexOf(button));
    readViewerButton(button);
    viewer.classList.add("is-open");
    viewer.setAttribute("aria-hidden", "false");
    body.classList.add("is-lock");
    if (closeButton) closeButton.focus();
  }

  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove("is-open");
    viewer.setAttribute("aria-hidden", "true");
    body.classList.remove("is-lock");
  }

  function stepViewer(direction) {
    if (!viewButtons.length) return;
    activeIndex = (activeIndex + direction + viewButtons.length) % viewButtons.length;
    readViewerButton(viewButtons[activeIndex]);
  }

  viewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      openViewer(button);
    });
  });

  if (closeButton) closeButton.addEventListener("click", closeViewer);
  if (nextButton) nextButton.addEventListener("click", function () { stepViewer(1); });
  if (prevButton) prevButton.addEventListener("click", function () { stepViewer(-1); });

  if (viewer) {
    viewer.addEventListener("click", function (event) {
      if (event.target === viewer) closeViewer();
    });
  }

  window.addEventListener("keydown", function (event) {
    var viewerOpen = viewer && viewer.classList.contains("is-open");
    if (event.key === "Escape") {
      if (viewerOpen) closeViewer();
      setMenu(false);
    }
    if (!viewerOpen) return;
    if (event.key === "ArrowLeft") stepViewer(-1);
    if (event.key === "ArrowRight") stepViewer(1);
  });

  var oracleCards = qsa(".oracle-card");
  var oracleReading = qs(".oracle-reading");

  oracleCards.forEach(function (card) {
    card.addEventListener("click", function () {
      oracleCards.forEach(function (item) {
        item.classList.toggle("is-flipped", item === card);
      });
      if (oracleReading) {
        oracleReading.textContent = card.dataset.reading || "";
      }
    });
  });

  var bookPrev = qs(".book-prev");
  var bookNext = qs(".book-next");
  var bookCount = qs(".book-count");
  var bookSpread = qs(".book-spread");
  var bookLeft = qs(".book-page--left");
  var bookRight = qs(".book-page--right");
  var bookSourcePages = qsa(".book-source [data-page]");
  var currentBook = 0;

  function setBookPage(index) {
    if (!bookSourcePages.length) return;
    currentBook = Math.max(0, Math.min(index, bookSourcePages.length - 1));
    if (currentBook % 2 !== 0) currentBook -= 1;
    updateBook();
  }

  function updateBook() {
    if (!bookLeft || !bookRight || !bookSourcePages.length) return;
    var leftPage = bookSourcePages[currentBook];
    var rightPage = bookSourcePages[currentBook + 1];

    bookLeft.innerHTML = leftPage ? leftPage.innerHTML : "";
    bookRight.innerHTML = rightPage ? rightPage.innerHTML : "";
    bookRight.hidden = !rightPage;

    if (bookCount) {
      bookCount.textContent = "page " + (currentBook + 1) + " of " + bookSourcePages.length;
    }
    if (bookPrev) bookPrev.disabled = currentBook === 0;
    if (bookNext) bookNext.disabled = currentBook >= bookSourcePages.length - 2;

    if (bookSpread && !reduceMotion) {
      bookSpread.classList.remove("is-turning");
      void bookSpread.offsetWidth;
      bookSpread.classList.add("is-turning");
    }
  }

  function nextBook() {
    if (currentBook < bookSourcePages.length - 2) {
      currentBook += 2;
      updateBook();
    }
  }

  function prevBook() {
    if (currentBook > 0) {
      currentBook -= 2;
      updateBook();
    }
  }

  if (bookNext) bookNext.addEventListener("click", nextBook);
  if (bookPrev) bookPrev.addEventListener("click", prevBook);
  updateBook();

  var filterButtons = qsa(".filter-chip");
  var portfolioCards = qsa(".portfolio-card");
  var portfolioState = qs(".portfolio-state");
  var portfolioSection = qs(".portfolio-section");
  var gameOrbs = qsa(".game-orb");

  function scrollToPortfolioGrid() {
    var grid = qs(".portfolio-grid");
    if (!grid) return;
    window.setTimeout(function () {
      var top = grid.getBoundingClientRect().top + window.pageYOffset - 110;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
    }, 180);
  }

  function applyFilter(kind, jumpToGrid) {
    var visible = 0;
    if (portfolioSection) {
      portfolioSection.classList.add("is-open");
    }
    portfolioCards.forEach(function (card) {
      var show = kind === "all" || card.dataset.kind === kind;
      card.classList.toggle("is-hidden", !show);
      card.setAttribute("aria-hidden", show ? "false" : "true");
      if (show) visible += 1;
    });
    filterButtons.forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.filter === kind);
    });
    if (portfolioState) {
      portfolioState.textContent = visible + " works visible";
    }
    if (jumpToGrid) {
      scrollToPortfolioGrid();
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.dataset.filter || "all", button.classList.contains("vault-door"));
    });
  });

  qsa("[data-filter-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      applyFilter(link.dataset.filterLink || "all", true);
    });
  });

  gameOrbs.forEach(function (button) {
    button.addEventListener("click", function () {
      gameOrbs.forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      setBookPage(Number(button.dataset.bookJump || 0));
    });
  });

  function setPointerVars(element, event) {
    var rect = element.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;
    element.style.setProperty("--mx", (x * 100).toFixed(2) + "%");
    element.style.setProperty("--my", (y * 100).toFixed(2) + "%");
    return { x: x, y: y };
  }

  if (allowPointerFx()) {
    qsa(".tilt-card").forEach(function (card) {
      var moveTilt = throttlePointer(function (event) {
        if (!allowPointerFx()) return;
        var point = setPointerVars(card, event);
        card.style.setProperty("--rx", ((0.5 - point.y) * 7).toFixed(2) + "deg");
        card.style.setProperty("--ry", ((point.x - 0.5) * 8).toFixed(2) + "deg");
      }, 34);

      card.addEventListener("pointermove", moveTilt, passiveEvent);
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
      });
    });

    qsa(".media-button").forEach(function (button) {
      var moveGlow = throttlePointer(function (event) {
        if (!allowPointerFx()) return;
        setPointerVars(button, event);
      }, 42);

      button.addEventListener("pointermove", moveGlow, passiveEvent);
    });
  }

  function addRipple(event) {
    if (reduceMotion) return;
    var target = event.currentTarget;
    var rect = target.getBoundingClientRect();
    var dot = document.createElement("span");
    dot.className = "ripple-dot";
    dot.style.setProperty("--ripple-x", (event.clientX - rect.left) + "px");
    dot.style.setProperty("--ripple-y", (event.clientY - rect.top) + "px");
    target.appendChild(dot);
    window.setTimeout(function () {
      dot.remove();
    }, 680);
  }

  qsa(".action, .filter-chip, .book-controls button, .oracle-card, .cover-card, .enter-gate").forEach(function (item) {
    item.addEventListener("click", addRipple);
  });

  function bootRabbitScene() {
    try {
      initRabbitScene();
    } catch (error) {
      body.classList.add("rabbit-fallback");
    }
  }

  function loadRabbitRuntime() {
    if (!qs("#rabbit-canvas")) return;
    if (window.THREE) {
      bootRabbitScene();
      return;
    }

    var runtime = document.createElement("script");
    runtime.src = "assets/vendor/three.min.js";
    runtime.async = true;
    runtime.onload = bootRabbitScene;
    runtime.onerror = function () {
      body.classList.add("rabbit-fallback");
    };
    document.body.appendChild(runtime);
  }

  window.requestAnimationFrame(function () {
    window.setTimeout(loadRabbitRuntime, smallScreen.matches ? 220 : 40);
  });

  if ("IntersectionObserver" in window) {
    if (!reduceMotion) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.14 });

      qsa(".reveal").forEach(function (item) {
        revealObserver.observe(item);
      });
    }

    revealCurrentHash();
    window.addEventListener("hashchange", revealCurrentHash);

    var sections = navLinks.map(function (link) {
      return qs(link.getAttribute("href"));
    }).filter(Boolean);

    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-34% 0px -56% 0px", threshold: 0.01 });

    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  } else {
    qsa(".reveal").forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  function revealCurrentHash() {
    if (!window.location.hash) return;
    var target = qs(window.location.hash);
    if (!target) return;
    qsa(".reveal", target).forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  function initRabbitScene() {
    var canvas = qs("#rabbit-canvas");
    if (!canvas || !window.THREE) return;

    var host = canvas.parentElement;
    var scene = new THREE.Scene();
    var isCover = host && host.classList.contains("cover-stage");
    var lightweightScene = reduceMotion || smallScreen.matches || coarsePointer.matches;
    var camera = new THREE.PerspectiveCamera(isCover ? 32 : 36, 1, 0.1, 100);
    camera.position.set(0, isCover ? 1.08 : 1.2, isCover ? 9.2 : 8.2);

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !lightweightScene && (window.devicePixelRatio || 1) < 2,
      powerPreference: "low-power"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lightweightScene ? 1 : 1.15));
    renderer.outputEncoding = THREE.sRGBEncoding;

    var rabbit = new THREE.Group();
    var stars = new THREE.Group();
    scene.add(rabbit);
    scene.add(stars);

    var white = new THREE.MeshStandardMaterial({
      color: 0xdfe4e2,
      roughness: 0.54,
      metalness: 0.04
    });
    var pearl = new THREE.MeshStandardMaterial({
      color: 0xbfcad0,
      roughness: 0.4,
      metalness: 0.18
    });
    var blush = new THREE.MeshStandardMaterial({
      color: 0xc9b8bd,
      roughness: 0.5,
      metalness: 0
    });
    var dark = new THREE.MeshStandardMaterial({
      color: 0x2a323b,
      roughness: 0.42,
      metalness: 0.08
    });
    var gold = new THREE.MeshStandardMaterial({
      color: 0xa99a76,
      roughness: 0.3,
      metalness: 0.34
    });
    var shadowPearl = new THREE.MeshStandardMaterial({
      color: 0xaeb9c0,
      roughness: 0.6,
      metalness: 0.08
    });

    function sphere(name, scale, position, material, segments) {
      var detail = segments || (lightweightScene ? 18 : 24);
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(1, detail, detail), material || white);
      mesh.name = name;
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.position.set(position[0], position[1], position[2]);
      rabbit.add(mesh);
      return mesh;
    }

    sphere("body", [1.42, 1.88, 1.12], [0, -0.5, 0], white);
    sphere("head", [1.02, 0.9, 0.9], [0, 1.15, 0.05], white);
    sphere("muzzle", [0.46, 0.28, 0.22], [0, 0.98, 0.82], pearl, 28);
    sphere("tail", [0.45, 0.45, 0.45], [0, -0.74, -1.02], pearl, 28);
    sphere("left-foot", [0.52, 0.22, 0.74], [-0.58, -2.1, 0.42], white, 28);
    sphere("right-foot", [0.52, 0.22, 0.74], [0.58, -2.1, 0.42], white, 28);
    sphere("left-shadow", [0.12, 1.48, 0.08], [-1.42, -0.35, -0.08], shadowPearl, 18).rotation.z = 0.1;
    sphere("right-shadow", [0.12, 1.42, 0.08], [1.42, -0.32, -0.08], shadowPearl, 18).rotation.z = -0.1;
    sphere("left-paw", [0.25, 0.72, 0.22], [-1.18, -0.42, 0.38], white, 28).rotation.z = -0.28;
    sphere("right-paw", [0.25, 0.72, 0.22], [1.18, -0.42, 0.38], white, 28).rotation.z = 0.28;
    sphere("left-eye", [0.08, 0.08, 0.055], [-0.34, 1.28, 0.82], dark, 20);
    sphere("right-eye", [0.08, 0.08, 0.055], [0.34, 1.28, 0.82], dark, 20);
    sphere("nose", [0.09, 0.055, 0.045], [0, 1.06, 1.02], blush, 20);

    function ear(side) {
      var outer = sphere(side + "-ear", [0.28, 1.42, 0.22], [side * 0.42, 2.38, -0.08], white, 32);
      outer.rotation.z = side * -0.18;
      var inner = sphere(side + "-inner-ear", [0.14, 1.05, 0.05], [side * 0.44, 2.38, 0.12], blush, 24);
      inner.rotation.z = side * -0.18;
    }
    ear(-1);
    ear(1);

    function wing(side) {
      var wingGroup = new THREE.Group();
      wingGroup.position.set(side * 1.08, 0.08, -0.48);
      wingGroup.rotation.z = side * -0.48;
      wingGroup.rotation.y = side * -0.42;
      rabbit.add(wingGroup);

      var featherCount = lightweightScene ? 4 : 6;
      for (var i = 0; i < featherCount; i += 1) {
        var feather = new THREE.Mesh(new THREE.SphereGeometry(1, lightweightScene ? 12 : 18, lightweightScene ? 12 : 18), pearl);
        feather.scale.set(0.16 + i * 0.02, 0.72 - i * 0.045, 0.075);
        feather.position.set(side * (0.18 + i * 0.14), 0.54 - i * 0.18, -0.08);
        feather.rotation.z = side * (0.46 + i * 0.12);
        wingGroup.add(feather);
      }
    }
    wing(-1);
    wing(1);

    var halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.26, 0.025, 12, 64),
      gold
    );
    halo.position.set(0, 1.6, -0.7);
    halo.rotation.x = Math.PI / 2.9;
    rabbit.add(halo);

    var starCount = lightweightScene ? 6 : 10;
    for (var s = 0; s < starCount; s += 1) {
      var angle = (Math.PI * 2 * s) / starCount;
      var star = new THREE.Mesh(new THREE.IcosahedronGeometry(s % 3 === 0 ? 0.07 : 0.045, 0), gold);
      star.position.set(Math.cos(angle) * 2.5, Math.sin(angle * 1.7) * 0.36 + 0.18, Math.sin(angle) * 2.5);
      stars.add(star);
    }

    var ambient = new THREE.HemisphereLight(0xffffff, 0x83919d, isCover ? 1.18 : 1.6);
    var key = new THREE.DirectionalLight(0xffffff, isCover ? 1.34 : 1.8);
    key.position.set(4, 5, 5);
    var rim = new THREE.PointLight(0x9fb0bd, isCover ? 1.7 : 1.4, 13);
    rim.position.set(-3.4, 2.2, -1.8);
    var floorGlow = new THREE.PointLight(0xffffff, isCover ? 0.7 : 0.4, 8);
    floorGlow.position.set(0, -2.7, 2.6);
    scene.add(ambient, key, rim, floorGlow);

    var baseScale = isCover ? 0.98 : 0.82;
    rabbit.scale.setScalar(baseScale);
    rabbit.position.y = isCover ? -0.06 : 0.1;

    var pointerX = 0;
    var pointerY = 0;
    var sceneActive = true;
    var hero = isCover ? qs(".cover-hero") : null;

    if (host) {
      host.classList.add("has-webgl");
      if (allowPointerFx()) {
        var moveScene = throttlePointer(function (event) {
          if (!allowPointerFx()) return;
          var rect = host.getBoundingClientRect();
          pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.75;
          pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.35;
          if (isCover && hero) {
            hero.style.setProperty("--hero-x", pointerX.toFixed(3));
            hero.style.setProperty("--hero-y", pointerY.toFixed(3));
          }
        }, 48);

        host.addEventListener("pointermove", moveScene, passiveEvent);
        host.addEventListener("pointerleave", function () {
          pointerX = 0;
          pointerY = 0;
          if (isCover && hero) {
            hero.style.setProperty("--hero-x", "0");
            hero.style.setProperty("--hero-y", "0");
          }
        }, passiveEvent);
      }
    }

    function resize() {
      var rect = (host || canvas).getBoundingClientRect();
      var width = Math.max(1, rect.width);
      var height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (isCover) {
        baseScale = width < 620 ? 0.78 : width < 980 ? 0.88 : 0.98;
        rabbit.scale.setScalar(baseScale);
        camera.position.z = width < 620 ? 9.1 : width < 980 ? 9.3 : 9.2;
      }
      camera.updateProjectionMatrix();
    }

    resize();
    var resizeScene = throttle(resize, 120);
    if (window.ResizeObserver && host) {
      new ResizeObserver(resizeScene).observe(host);
    }
    window.addEventListener("resize", resizeScene, passiveEvent);

    if ("IntersectionObserver" in window && host) {
      var sceneObserver = new IntersectionObserver(function (entries) {
        var nextActive = entries.some(function (entry) {
          return entry.isIntersecting;
        });
        if (nextActive === sceneActive) return;
        sceneActive = nextActive;
        if (sceneActive) {
          startRender();
        } else {
          stopRender();
        }
      }, { threshold: 0.04 });
      sceneObserver.observe(host);
    }

    var clock = new THREE.Clock();
    var lastFrame = 0;
    var frameId = 0;
    var frameGap = lightweightScene ? 70 : 34;

    function startRender() {
      if (reduceMotion || frameId || !sceneActive) return;
      frameId = window.requestAnimationFrame(render);
    }

    function stopRender() {
      if (!frameId) return;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    function render(now) {
      frameId = 0;
      if (!sceneActive) return;
      if (now && now - lastFrame < frameGap) {
        startRender();
        return;
      }
      lastFrame = now || nowTime();
      var t = clock.getElapsedTime();
      rabbit.rotation.y += ((pointerX + t * 0.24) - rabbit.rotation.y) * 0.032;
      rabbit.rotation.x += ((-pointerY + Math.sin(t * 1.4) * 0.035) - rabbit.rotation.x) * 0.045;
      rabbit.position.y = (isCover ? -0.06 : 0.1) + Math.sin(t * 1.05) * 0.06;
      stars.rotation.y = -t * 0.11;
      stars.rotation.x = Math.sin(t * 0.5) * 0.12;
      renderer.render(scene, camera);
      startRender();
    }

    renderer.render(scene, camera);
    startRender();
  }
}());
