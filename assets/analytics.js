/* Verbo — Analytics (GA4) + consentimento LGPD
   ------------------------------------------------------------------
   - O GA4 só carrega depois que a pessoa aceita no banner.
   - A escolha fica salva em localStorage ("verbo_consent": "granted" | "denied").
   - Eventos de clique são marcados via atributos data-evt e data-loc no HTML.
   ------------------------------------------------------------------ */
(function () {
  var GA_ID = "G-GSZPF1ETBS";
  var STORAGE_KEY = "verbo_consent";
  var loaded = false;

  // fila de eventos disparados antes do GA carregar (após consentimento)
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }

  function loadGA() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  // dispara um evento (só se houver consentimento)
  function track(name, params) {
    if (getConsent() !== "granted") return;
    if (!loaded) loadGA();
    gtag("event", name, params || {});
  }

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
  }

  /* ---------- Banner ---------- */
  function buildBanner() {
    if (getConsent()) return; // já decidiu, não mostra
    var bar = document.createElement("div");
    bar.className = "consent-bar";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Aviso de cookies");
    bar.innerHTML =
      '<p>Usamos cookies para entender como o site é usado e melhorar sua experiência. ' +
      'Você pode aceitar ou recusar a coleta de dados de navegação.</p>' +
      '<div class="consent-actions">' +
        '<button type="button" class="consent-btn ghost" data-consent="denied">Recusar</button>' +
        '<button type="button" class="consent-btn solid" data-consent="granted">Aceitar</button>' +
      '</div>';
    document.body.appendChild(bar);
    requestAnimationFrame(function(){ bar.classList.add("show"); });

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consent]");
      if (!btn) return;
      var choice = btn.getAttribute("data-consent");
      setConsent(choice);
      bar.classList.remove("show");
      setTimeout(function(){ bar.remove(); }, 300);
      if (choice === "granted") {
        loadGA();
        // registra o pageview da página atual logo após aceitar
        track("page_view", { page_path: location.pathname });
      }
    });
  }

  /* ---------- Liga os cliques marcados no HTML ---------- */
  function wireEvents() {
    document.querySelectorAll("[data-evt]").forEach(function (el) {
      el.addEventListener("click", function () {
        track(el.getAttribute("data-evt"), {
          botao_local: el.getAttribute("data-loc") || "",
          link_url: el.getAttribute("href") || ""
        });
      });
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    // se já consentiu numa visita anterior, carrega GA direto
    if (getConsent() === "granted") {
      loadGA();
      track("page_view", { page_path: location.pathname });
    }
    buildBanner();
    wireEvents();
  });

  // expõe para uso manual, se necessário
  window.verboTrack = track;
})();
