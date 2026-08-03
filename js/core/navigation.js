
    // ---------- Navegación ----------
    const tabs = Array.from(document.querySelectorAll(".tab"));
    const screens = Array.from(document.querySelectorAll(".screen"));
    
    // ---------- Paginación ----------
    const PAGE_SIZE = 4;

    // Estado de página por pantalla
    const pageState = {
      "series-pendientes": 1,
      "series-vistas": 1,
      "peliculas-pendientes": 1,
      "peliculas-vistas": 1,
    };

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function getPaged(items, screenName) {
      const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      const page = clamp(pageState[screenName] || 1, 1, totalPages);
      pageState[screenName] = page;
  
      const start = (page - 1) * PAGE_SIZE;
      return {
        page,
        totalPages,
        slice: items.slice(start, start + PAGE_SIZE)
      };
    }

    
    function renderPager(screenName, totalItems) {
      const pagerEl = document.getElementById(`pager-${screenName}`);
      if (!pagerEl) return;
      
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      if (totalPages <= 1) {
        pagerEl.style.display = "none";
        pagerEl.innerHTML = "";
        return;
      }
      
      pagerEl.style.display = "flex";
      const page = clamp(pageState[screenName] || 1, 1, totalPages);
      pageState[screenName] = page;
      
      
      const options = [];
      for (let i = 1; i <= totalPages; i++) {
        options.push(`
          <option value="${i}" ${i === page ? "selected" : ""}>
            Página ${i}
          </option>
        `);
      }

      
      pagerEl.innerHTML = `
        <button class="pagerBtn" type="button"
          data-pager-screen="${screenName}" data-pager-page="${page - 1}"
          ${page === 1 ? "disabled" : ""}>
          Anterior
        </button>
    
        <div class="pagerSelectWrap">
          <select class="pagerSelect" data-pager-select="${screenName}" aria-label="Seleccionar página">
            ${options.join("")}
          </select>
        </div>
    
        <button class="pagerBtn" type="button"
          data-pager-screen="${screenName}" data-pager-page="${page + 1}"
          ${page === totalPages ? "disabled" : ""}>
          Siguiente
        </button>
      `;
    }

    // Delegación de eventos para paginación
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pager-screen][data-pager-page]");
      if (!btn) return;
      if (btn.hasAttribute("disabled")) return;
  
      const screenName = btn.dataset.pagerScreen;
      const page = Number(btn.dataset.pagerPage || "1");
      pageState[screenName] = page;
  
      // Re-render según pantalla
      if (screenName === "series-pendientes") renderPendientes("series");
      if (screenName === "peliculas-pendientes") renderPendientes("peliculas");
      if (screenName === "series-vistas") renderVistas("series");
      if (screenName === "peliculas-vistas") renderVistas("peliculas");
    });
    
    
    document.addEventListener("change", (e) => {
      const select = e.target.closest("[data-pager-select]");
      if (!select) return;
      
      const screenName = select.dataset.pagerSelect;
      const page = Number(select.value || "1");
      pageState[screenName] = page;
      
      if (screenName === "series-pendientes") renderPendientes("series");
      if (screenName === "peliculas-pendientes") renderPendientes("peliculas");
      if (screenName === "series-vistas") renderVistas("series");
      if (screenName === "peliculas-vistas") renderVistas("peliculas");
    });
    


    function showScreen(screenName) {
      const exists = screens.some(s => s.dataset.screen === screenName);
      if (!exists) {
        console.warn("Pantalla no encontrada:", screenName);
        return;
      }
      
      // detectar pantalla activa anterior
      const prevScreen = document.querySelector(".screen.active")?.dataset?.screen || null;
      
      // si salimos de una pantalla con estado visual, la limpiamos
      if (prevScreen && prevScreen !== screenName) {
        resetViewState(prevScreen);
      }
      
      // reset a página 1 al entrar en una pantalla paginada
      if (typeof pageState !== "undefined" && pageState && pageState[screenName] != null) {
        pageState[screenName] = 1;
      }
      
      screens.forEach(s => s.classList.toggle("active", s.dataset.screen === screenName));

      const activeScreen = screens.find(s => s.dataset.screen === screenName);
      if (activeScreen) {
        activeScreen.scrollTop = 0;
        requestAnimationFrame(() => { activeScreen.scrollTop = 0; });
      }

      if (screenName.startsWith("anadir-") && activeScreen) {
        const form = activeScreen.querySelector("form");
        if (form && !form.dataset.editId) {
          form.reset();
          if (typeof resetRatingsInside === "function") resetRatingsInside(form);
          if (typeof resetTMDbFormState === "function") resetTMDbFormState(form);
          form.querySelectorAll(".msg").forEach(message => {
            message.textContent = "";
            message.className = "msg";
          });
          if (typeof SeasonEpisodeSelectors !== "undefined") {
            SeasonEpisodeSelectors.refreshForm(form, {
              currentSeason: "",
              currentEpisode: ""
            });
          }
        }
      }
      
      // refresco de listas cuando entras
      if (screenName === "series-pendientes") renderPendientes("series");
      if (screenName === "peliculas-pendientes") renderPendientes("peliculas");
      if (screenName === "series-vistas") renderVistas("series");
      if (screenName === "peliculas-vistas") renderVistas("peliculas");
      if (
        screenName === "resumen-home" &&
        typeof renderStatisticsDashboard === "function"
      ) {
        renderStatisticsDashboard();
      }
      if (
        screenName === "colecciones-inteligentes" &&
        typeof SmartCollectionsUI !== "undefined"
      ) {
        SmartCollectionsUI.resetView();
      }
      if (
        screenName === "mis-plataformas" &&
        typeof UserPlatformsUI !== "undefined"
      ) {
        UserPlatformsUI.open();
      }
      
      updateAllFilterBadges();
      syncAllSearchInputs();
    }
 
    
    
    function setMainTab(main){
      clearEditModeIfAny();
      tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.main === main)));
      if(main === "series")    showScreen("series-home");
      if(main === "peliculas") showScreen("peliculas-home");
      if(main === "resumen")   showScreen("resumen-home");
      if(main === "anadir")    showScreen("anadir-home");
      history.replaceState(null, "", "#" + main);
    }
