/* ============================================================
   Page de résultats du quiz poids (variante B du test A/B).
   Lit les réponses via la RPC quiz_get(sid), personnalise la page
   et trace chaque étape jusqu'au clic vers le paiement (RPC
   funnel_track), pour savoir enfin où les gens décrochent.
   ============================================================ */
(function () {
  "use strict";

  var SB_URL = "https://ydyogdzwdudmuzbpsozz.supabase.co";
  var SB_KEY = "sb_publishable_W8FTMb_XDkEKO4XbRRB7CQ_YJEURUS-";
  var VARIANT = "B";
  var PAGE = "resultats_v2";
  var CHECKOUT = {
    annuel: "https://app.hypnotyse.com/paiement-poids-annuel",
    mensuel: "https://app.hypnotyse.com/paiement-poids-mensuel"
  };
  var VALEUR = { annuel: 89.9, mensuel: 19.9 };

  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var sid = params.get("sid") || "";
  var prenomUrl = (params.get("prenom") || "").trim();
  var fbclid = params.get("fbclid") || "";
  try {
    if (fbclid) localStorage.setItem("hy_fbclid", fbclid);
    else fbclid = localStorage.getItem("hy_fbclid") || "";
  } catch (e) {}

  var validSid = /^[0-9a-f-]{36}$/i.test(sid);
  window.dataLayer = window.dataLayer || [];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function cap(s) { s = String(s || "").trim(); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
  function num(v) { var n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; }
  function fmtKg(n) { return (Math.round(n * 10) / 10).toLocaleString("fr-FR") + " kg"; }

  function rpc(name, body, keepalive) {
    return fetch(SB_URL + "/rest/v1/rpc/" + name, {
      method: "POST",
      keepalive: !!keepalive,
      headers: { "apikey": SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  /* Un événement n'est envoyé qu'une fois par affichage, sauf les clics */
  var sent = {};
  function track(event, meta, keepalive) {
    if (!validSid) return;
    var once = event !== "cta_click" && event !== "faq_open";
    if (once && sent[event]) return;
    sent[event] = true;
    rpc("funnel_track", { p_sid: sid, p_event: event, p_page: PAGE, p_variant: VARIANT, p_meta: meta || {} }, keepalive)
      .catch(function () {});
  }

  /* ---------- Liens vers le paiement : jamais l'email dans l'URL ---------- */
  function lien(base) {
    var u = new URL(base);
    if (prenomUrl) u.searchParams.set("prenom", prenomUrl);
    if (validSid) u.searchParams.set("sid", sid);
    if (fbclid) u.searchParams.set("fbclid", fbclid);
    return u.toString();
  }
  $("ctaAnnuel").href = lien(CHECKOUT.annuel);
  $("ctaMensuel").href = lien(CHECKOUT.mensuel);

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("[data-cta]") : null;
    if (!a) return;
    var cta = a.getAttribute("data-cta");
    var plan = cta === "mensuel" ? "mensuel" : (cta === "annuel" ? "annuel" : null);
    track("cta_click", { cta: cta, plan: plan }, true);
    if (plan) {
      window.dataLayer.push({ event: "begin_checkout", quiz_type: "poids", session_id: sid, variant: VARIANT,
        plan: plan, value: VALEUR[plan], currency: "EUR" });
    }
  });

  /* ---------- Personnalisation ---------- */
  function setTitle(prenom) {
    if (!prenom) return;
    $("heroTitle").innerHTML = esc(cap(prenom)) + ", voici ce qui bloque <em>vraiment vos efforts</em>";
  }
  setTitle(prenomUrl);

  function niveau(v) {
    if (v >= 4) return { t: "Très marqué", cls: "" };
    if (v === 3) return { t: "Marqué", cls: "" };
    return { t: "Modéré", cls: "mod" };
  }

  function render(d) {
    var a = d.answers || {};
    var homme = /^homme/i.test(String(d.sexe || a.sexe || ""));
    var e = homme ? "" : "e";
    var prenom = cap(d.prenom || prenomUrl);
    var sucre = parseInt(a.sucre, 10) || 0;
    var stress = parseInt(a.stress, 10) || 0;
    var echec = parseInt(a.echec, 10) || 0;
    var moments = [].concat(a.moments_grignotage || []).filter(function (m) { return !/jamais/i.test(m); });
    var soir = moments.some(function (m) { return /soir|nuit/i.test(m); });
    var obstacle = String(d.obstacle_percu || "");
    var duree = String(d.duree_tentative || "");
    var score = parseInt(d.score_emotionnel, 10) || 0;
    var moment = String(d.moment_ecoute || "");

    /* Le frein principal, déduit des réponses (jamais un pourcentage de réussite) */
    var frein;
    if (stress >= 4 && soir) frein = "le grignotage émotionnel du soir";
    else if (stress >= 4) frein = "l'alimentation émotionnelle";
    else if (sucre >= 4) frein = "les envies de sucre";
    else if (echec >= 4) frein = "le cercle écart et culpabilité";
    else if (soir) frein = "le grignotage du soir";
    else if (/grignotage/i.test(obstacle)) frein = "le grignotage et les envies";
    else frein = "des automatismes alimentaires";

    $("heroTitle").innerHTML = (prenom ? esc(prenom) + ", votre" : "Votre") + " frein principal : <em>" + esc(frein) + "</em>";

    var depuis = {
      "Plus de 3 ans": "Vous essayez depuis plus de 3 ans.",
      "Entre 1 et 3 ans": "Vous essayez depuis plus d'un an.",
      "Entre 6 mois et 1 an": "Vous essayez depuis plusieurs mois.",
      "Moins de 6 mois": "Vous avez commencé à chercher une solution il y a peu."
    }[duree] || "";
    $("heroSub").textContent = (depuis ? depuis + " " : "") +
      "Si les régimes n'ont pas tenu, ce n'est pas un manque de volonté : ils agissent sur l'assiette, alors que vos envies naissent d'automatismes inconscients. C'est précisément là qu'agit l'autohypnose.";

    /* Repères du profil */
    var chips = [];
    var pa = num(d.poids_actuel), pi = num(d.poids_ideal);
    if (pa && pi && pi < pa) chips.push(["Votre objectif", fmtKg(pi), "aujourd'hui " + fmtKg(pa)]);
    if (duree) chips.push(["Vous essayez", duree.toLowerCase(), "sans résultat durable"]);
    if (score) chips.push(["Lien émotions et nourriture", score >= 12 ? "Très marqué" : (score >= 9 ? "Marqué" : "Modéré"), "score " + score + " sur 15"]);
    if (moment) chips.push(["Votre séance", moment.replace(/^Le |^Dans la /, "").replace(/^./, function (c) { return c.toUpperCase(); }), (a.temps_dispo ? String(a.temps_dispo).replace(" ou plus", "+") : "20 minutes") + " par jour"]);
    if (chips.length) {
      $("chips").innerHTML = chips.slice(0, 4).map(function (c) {
        return '<div class="chip"><div class="k">' + esc(c[0]) + '</div><div class="v">' + esc(c[1]) + "<small>" + esc(c[2]) + "</small></div></div>";
      }).join("");
      $("chips").hidden = false;
    }

    /* Les 3 mécanismes, classés par intensité */
    var mecas = [
      { v: sucre, t: "Les envies de sucre", p: "Le sucre active le circuit de la récompense : votre cerveau a appris à le réclamer pour se sentir mieux. Ce n'est pas de la gourmandise, c'est un réflexe appris, et un réflexe appris peut se désapprendre." },
      { v: stress, t: "Manger pour s'apaiser", p: "Stress, ennui, fatigue : la nourriture est devenue votre façon la plus rapide de vous apaiser. Les séances installent d'autres réponses à ces moments, pour que l'envie ne se déclenche plus toute seule." },
      { v: echec, t: "Le cercle écart, culpabilité, craquage", p: "Après un écart, la culpabilité pousse à en faire un autre, et le cercle s'auto-entretient. Une partie des séances est dédiée à le briser, pour qu'un écart reste un simple écart." }
    ].filter(function (m) { return m.v > 0; }).sort(function (x, y) { return y.v - x.v; });

    if (mecas.length) {
      $("mecas").innerHTML = mecas.map(function (m) {
        var n = niveau(m.v);
        return '<div class="meca"><div class="meca-head"><strong>' + esc(m.t) + '</strong><span class="' + n.cls + '">' + n.t +
          '</span></div><div class="bar"><i data-w="' + (m.v * 20) + '"></i></div><p>' + esc(m.p) + "</p></div>";
      }).join("");
      $("diag").hidden = false;
      requestAnimationFrame(function () {
        [].forEach.call(document.querySelectorAll(".bar i"), function (i) { i.style.width = i.getAttribute("data-w") + "%"; });
      });
    }

    if (moments.length) {
      var liste = moments.map(function (m, i) { return i ? m.charAt(0).toLowerCase() + m.slice(1) : m; });
      var phrase = liste.length > 1 ? liste.slice(0, -1).join(", ") + " et " + liste[liste.length - 1] : liste[0];
      $("momentsTxt").textContent = phrase +
        ". C'est là que la fatigue baisse les défenses : vos premières séances ciblent ces moments en priorité.";
      $("moments").hidden = false;
      $("diag").hidden = false;
    }

    var objectifs = String(d.objectif_vie || "").split("|").map(function (s) { return s.trim(); }).filter(Boolean);
    if (objectifs.length) {
      var box = document.createElement("div");
      box.className = "quote-box";
      box.innerHTML = '<div class="k">Ce que vous voulez vraiment retrouver</div><p>' +
        objectifs.map(esc).join("<br>") + "</p>";
      $("diag").appendChild(box);
      $("diag").hidden = false;
    }

    /* Plan : la première semaine vise son moment le plus difficile */
    if (soir) {
      $("w1t").textContent = "Apaiser vos soirées";
      $("w1p").textContent = "Les premières séances ciblent le moment où l'envie est la plus forte : le soir. Elles installent un état de calme et désamorcent le réflexe du placard.";
    } else if (stress >= 4) {
      $("w1t").textContent = "Désamorcer le réflexe du stress";
      $("w1p").textContent = "Les premières séances apprennent à votre corps à retrouver le calme sans passer par la nourriture quand la tension monte.";
    }
    if (prenom) $("planTitle").innerHTML = esc(prenom) + ", vos <em>21 premiers jours</em>";

    var rdv = {
      "Le soir au coucher": ["🌙", "Vous avez choisi d'écouter vos séances le soir au coucher : c'est le moment idéal, car l'état qui précède le sommeil favorise naturellement l'autohypnose."],
      "Le matin au réveil": ["☀️", "Vous avez choisi le matin au réveil : votre esprit est encore calme et réceptif, idéal pour démarrer la journée avec de nouveaux réflexes."],
      "Dans la journée": ["🌿", "Vous avez choisi d'écouter vos séances dans la journée : une pause de 20 minutes, allongé" + e + " ou assis" + e + ", suffit. Beaucoup de membres l'écoutent à la pause déjeuner."]
    }[moment];
    if (rdv) { $("rdv").querySelector("b").textContent = rdv[0]; $("rdvTxt").textContent = rdv[1]; }

    if (prenom) $("offreTitle").innerHTML = esc(prenom) + ", commencez <em>sans risque</em>";
  }

  if (validSid) {
    rpc("quiz_get", { p_id: sid })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var ok = d && typeof d === "object" && (d.poids_actuel != null || d.score_emotionnel != null);
        if (ok) render(d);
        track("results_view", { donnees: !!ok });
        window.dataLayer.push({ event: "results_view", quiz_type: "poids", session_id: sid, variant: VARIANT });
      })
      .catch(function () { track("results_view", { donnees: false }); });
  }

  /* ---------- Lecteur audio ---------- */
  var audio = $("audio"), playing = false, joue30 = false;
  function dureeTxt(s) { var m = Math.floor(s / 60), r = Math.round(s % 60); return m + " min " + (r < 10 ? "0" : "") + r; }
  $("player").addEventListener("click", function () {
    if (playing) { audio.pause(); return; }
    audio.play().catch(function () {});
  });
  audio.addEventListener("play", function () { playing = true; $("playIco").textContent = "❚❚"; track("audio_play"); });
  audio.addEventListener("pause", function () { playing = false; $("playIco").textContent = "▶"; });
  audio.addEventListener("loadedmetadata", function () { if (isFinite(audio.duration)) $("playDur").textContent = "Durée " + dureeTxt(audio.duration); });
  audio.addEventListener("timeupdate", function () {
    if (audio.duration) $("playBar").style.width = (audio.currentTime / audio.duration * 100) + "%";
    if (!joue30 && audio.currentTime >= 30) { joue30 = true; track("audio_30s"); }
  });

  /* ---------- FAQ ---------- */
  [].forEach.call(document.querySelectorAll(".faq details"), function (det, i) {
    det.addEventListener("toggle", function () { if (det.open) track("faq_open", { q: i + 1 }); });
  });

  /* ---------- Défilement : mi-page, offre visible, barre fixe ---------- */
  var heroCta = document.querySelector(".hero .cta");
  var offre = $("offre");
  var sticky = $("sticky");
  var heroVisible = true, offreVisible = false;
  function majSticky() {
    var on = !heroVisible && !offreVisible;
    sticky.classList.toggle("on", on);
    sticky.setAttribute("aria-hidden", on ? "false" : "true");
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; majSticky(); }).observe(heroCta);
    new IntersectionObserver(function (en) {
      offreVisible = en[0].isIntersecting;
      if (offreVisible) track("results_scroll_offer");
      majSticky();
    }, { threshold: 0.15 }).observe(offre);
  }
  window.addEventListener("scroll", function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0 && scrollY / h >= 0.5) track("results_scroll_50");
  }, { passive: true });
})();
