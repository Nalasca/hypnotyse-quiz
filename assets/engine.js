/* ============================================================
   Moteur de quiz Hypnotyse
   Générique : chaque quiz définit window.QUIZ (voir poids/quiz.js)
   puis charge ce fichier. QUIZ décrit les étapes, les champs
   promus en colonnes Supabase et les paramètres de redirection.
   ============================================================ */

/* ---------- Config technique ---------- */
const SUPABASE_URL = "https://ydyogdzwdudmuzbpsozz.supabase.co";
const SUPABASE_KEY = "sb_publishable_W8FTMb_XDkEKO4XbRRB7CQ_YJEURUS-";
const SB_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Content-Type": "application/json"
};

let CONFIG = {
  redirect_url_results: "https://app.hypnotyse.com/bilan-resultats",
  redirect_url_fallback: "https://www.hypnotyse.com",
  pixel_id: "",
  quiz_active: "true",
  webhook_url: ""
};

/* ---------- Session & tracking ---------- */
const params = new URLSearchParams(location.search);
const fbclid = params.get("fbclid") || localStorage.getItem("hy_fbclid") || null;
if (params.get("fbclid")) localStorage.setItem("hy_fbclid", params.get("fbclid"));

const SESSION_STORAGE_KEY = "hy_quiz_session_" + QUIZ.type;
let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
let sessionCreated = !!sessionId;
if (!sessionId) {
  sessionId = (crypto.randomUUID) ? crypto.randomUUID() :
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random()*16|0; return (c==="x"?r:(r&0x3|0x8)).toString(16);
    });
}

const state = {
  answers: {},        // toutes les réponses brutes
  stepIndex: 0,
  quizStarted: false
};

/* Toute la persistance passe par la fonction RPC quiz_save (security definer) :
   la table quiz_sessions est fermée aux accès directs anonymes, et quiz_save
   fait un upsert, donc aucune sauvegarde n'est perdue même si une requête
   précédente a échoué. */
function sbSave(fields) {
  return fetch(SUPABASE_URL + "/rest/v1/rpc/quiz_save", {
    method: "POST",
    headers: SB_HEADERS,
    body: JSON.stringify({ p_id: sessionId, p_fields: fields }),
    keepalive: true
  });
}

/* Enregistre le contexte (quiz, tracking) une fois ; retente à chaque
   réponse tant que la requête n'a pas abouti. */
async function ensureSession() {
  if (sessionCreated) return;
  try {
    const res = await sbSave({
      quiz_type: QUIZ.type,
      fbclid: fbclid,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_content: params.get("utm_content"),
      landing_variant: params.get("lp") || null
    });
    if (res.ok) {
      sessionCreated = true;
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
  } catch(e) { /* silencieux, ne bloque jamais la personne */ }
}

function saveProgress(extraFields) {
  const body = Object.assign({
    current_step: state.stepIndex,
    answers: state.answers
  }, extraFields || {});
  try { sbSave(body); } catch(e) { /* silencieux */ }
}

/* ---------- Meta Pixel ---------- */
function initPixel(pixelId) {
  if (!pixelId) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', pixelId);
  fbq('track', 'PageView');
}
function trackQuizStart() {
  if (window.fbq) fbq('trackCustom', 'QuizStart', {}, { eventID: "qs_" + sessionId });
}
function trackLead() {
  if (window.fbq) fbq('track', 'Lead', {}, { eventID: sessionId });
}

/* ---------- Rendu ---------- */
const app = document.getElementById("app");
const fill = document.getElementById("progressFill");
const plabel = document.getElementById("progressLabel");
const btnBack = document.getElementById("btnBack");

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"); }

/* Contexte passé aux écrans personnalisés du quiz (réassurance, etc.) */
const ctx = { app, state, esc, next, config: CONFIG };

function render() {
  const step = QUIZ.steps[state.stepIndex];
  const pct = Math.round(((state.stepIndex+1)/QUIZ.steps.length)*100);
  fill.style.width = pct + "%";
  plabel.textContent = step.q ? ("Question " + step.q + " sur " + QUIZ.totalQuestions) : "";
  btnBack.classList.toggle("visible", state.stepIndex > 0 && step.type !== "email");
  app.className = "screen active" + (step.rea ? " rea" : "");

  if (step.type === "single")   return renderSingle(step);
  if (step.type === "multi")    return renderMulti(step);
  if (step.type === "number")   return renderNumber(step);
  if (step.type === "scale")    return renderScale(step);
  if (step.type === "custom")   return step.render(ctx);
  if (step.type === "email")    return renderEmail();
}

function next(extraFields) {
  if (!state.quizStarted) { state.quizStarted = true; trackQuizStart(); }
  ensureSession();
  state.stepIndex++;
  saveProgress(extraFields);
  window.scrollTo(0,0);
  render();
}
btnBack.addEventListener("click", () => {
  if (state.stepIndex > 0) { state.stepIndex--; render(); }
});

/* Champs promus en colonnes : step.promote = true, et step.onAnswer(valeur, state)
   peut retourner des champs calculés supplémentaires (IMC, score, etc.) */
function promotedFields(step, value) {
  const promoted = {};
  if (step.promote) promoted[step.key] = Array.isArray(value) ? value.join(" | ") : value;
  if (step.onAnswer) Object.assign(promoted, step.onAnswer(value, state));
  return promoted;
}

/* ---------- Choix unique ---------- */
function renderSingle(step) {
  app.innerHTML = `
    <div class="eyebrow">${step.eyebrow || "Votre bilan personnalisé"}</div>
    <h1>${step.title}</h1>
    ${step.sub ? `<div class="sub">${step.sub}</div>` : `<div style="height:18px"></div>`}
    <div class="options" id="opts"></div>`;
  const box = document.getElementById("opts");
  step.options.forEach(o => {
    const isObj = typeof o === "object";
    const val = isObj ? o.v : o;
    const btn = document.createElement("button");
    btn.className = "opt";
    btn.innerHTML = step.morpho
      ? `<span class="morpho-badge">${esc(val)}</span><span><strong>Silhouette en ${esc(val)}</strong><small>${esc(o.t)}</small></span>`
      : `<span class="check"></span><span>${esc(val)}</span>`;
    btn.addEventListener("click", () => {
      box.querySelectorAll(".opt").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.answers[step.key] = val;
      setTimeout(() => next(promotedFields(step, val)), 280);
    });
    box.appendChild(btn);
  });
}

/* ---------- Choix multiple ---------- */
function renderMulti(step) {
  app.innerHTML = `
    <div class="eyebrow">${step.eyebrow || "Votre bilan personnalisé"}</div>
    <h1>${step.title}</h1>
    <div class="sub">${step.sub || ""}</div>
    <div class="options" id="opts"></div>
    <button class="cta" id="btnNext" disabled>Continuer</button>`;
  const box = document.getElementById("opts");
  const btnNext = document.getElementById("btnNext");
  const sel = new Set(state.answers[step.key] || []);
  step.options.forEach(o => {
    const btn = document.createElement("button");
    btn.className = "opt" + (sel.has(o) ? " selected" : "");
    btn.innerHTML = `<span class="check"></span><span>${esc(o)}</span>`;
    btn.addEventListener("click", () => {
      if (sel.has(o)) { sel.delete(o); btn.classList.remove("selected"); }
      else if (sel.size < step.max) { sel.add(o); btn.classList.add("selected"); }
      btnNext.disabled = sel.size === 0;
    });
    box.appendChild(btn);
  });
  btnNext.disabled = sel.size === 0;
  btnNext.addEventListener("click", () => {
    const arr = [...sel];
    state.answers[step.key] = arr;
    next(promotedFields(step, arr));
  });
}

/* ---------- Saisie numérique ---------- */
function renderNumber(step) {
  app.innerHTML = `
    <div class="eyebrow">${step.eyebrow || "Votre bilan personnalisé"}</div>
    <h1>${step.title}</h1>
    ${step.sub ? `<div class="sub">${step.sub}</div>` : `<div style="height:18px"></div>`}
    <div class="num-wrap">
      <input class="num-input" id="numInput" type="number" inputmode="${step.decimal ? "decimal":"numeric"}"
        ${step.decimal ? 'step="0.1"' : ''} placeholder="${step.placeholder}" value="${state.answers[step.key] ?? ""}">
      <span class="num-unit">${step.unit}</span>
    </div>
    <div class="num-hint" id="numHint"></div>
    <button class="cta" id="btnNext">Continuer</button>`;
  const input = document.getElementById("numInput");
  const hint = document.getElementById("numHint");
  input.focus();
  function validate() {
    const v = parseFloat(String(input.value).replace(",","."));
    if (isNaN(v)) { hint.textContent = ""; return null; }
    if (v < step.min || v > step.max) {
      hint.textContent = `Merci d'indiquer une valeur entre ${step.min} et ${step.max} ${step.unit}.`;
      return null;
    }
    const custom = step.validate ? step.validate(v, state) : null;
    if (custom) { hint.textContent = custom; return null; }
    hint.textContent = "";
    return v;
  }
  function submit() {
    const v = validate();
    if (v === null) { if(!input.value) hint.textContent = "Merci de renseigner ce champ."; return; }
    state.answers[step.key] = v;
    next(promotedFields(step, v));
  }
  input.addEventListener("input", validate);
  input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  document.getElementById("btnNext").addEventListener("click", submit);
}

/* ---------- Échelle 1-5 ---------- */
function renderScale(step) {
  app.innerHTML = `
    <div class="eyebrow">${step.eyebrow || "Est-ce que cette phrase vous ressemble ?"}</div>
    <h1>${step.title}</h1>
    <div style="height:18px"></div>
    <div class="scale" id="scale"></div>
    <div class="scale-legend"><span>Pas du tout</span><span>Totalement</span></div>`;
  const box = document.getElementById("scale");
  for (let i=1; i<=5; i++) {
    const b = document.createElement("button");
    b.textContent = i;
    if (state.answers[step.key] === i) b.classList.add("selected");
    b.addEventListener("click", () => {
      box.querySelectorAll("button").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      state.answers[step.key] = i;
      setTimeout(() => next(promotedFields(step, i)), 300);
    });
    box.appendChild(b);
  }
}

/* ---------- Email + redirection vers les résultats ---------- */
function renderEmail() {
  fill.style.width = "97%";
  plabel.textContent = "Dernière étape";
  app.innerHTML = `
    <div class="eyebrow">Votre bilan est prêt</div>
    <h1>Où souhaitez-vous <em>recevoir</em> vos résultats ?</h1>
    <div class="sub">Votre profil personnalisé et votre programme recommandé vous attendent sur la page suivante.</div>
    <div class="field"><label for="fPrenom">Votre prénom</label>
      <input id="fPrenom" type="text" autocomplete="given-name" placeholder="Marie"></div>
    <div class="field"><label for="fEmail">Votre adresse email</label>
      <input id="fEmail" type="email" autocomplete="email" inputmode="email" placeholder="marie@exemple.fr"></div>
    <label class="consent"><input type="checkbox" id="fConsent">
      <span>J'accepte de recevoir mes résultats et les informations relatives au programme par email.</span></label>
    <div class="num-hint" id="formHint"></div>
    <button class="cta green" id="btnNext">Découvrir mes résultats</button>
    <div class="legal">Vos données restent confidentielles et ne sont jamais partagées. L'autohypnose est déconseillée aux personnes diagnostiquées avec des troubles psychotiques ou de schizophrénie. Hypnotyse ne remplace pas un avis médical.</div>`;
  const hint = document.getElementById("formHint");
  document.getElementById("btnNext").addEventListener("click", () => {
    const prenom = document.getElementById("fPrenom").value.trim();
    const email = document.getElementById("fEmail").value.trim();
    const consent = document.getElementById("fConsent").checked;
    if (!prenom) { hint.textContent = "Merci d'indiquer votre prénom."; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { hint.textContent = "Merci d'indiquer une adresse email valide."; return; }
    if (!consent) { hint.textContent = "Merci de cocher la case pour recevoir vos résultats."; return; }
    hint.textContent = "";
    const btn = document.getElementById("btnNext");
    btn.disabled = true; btn.textContent = "Préparation de vos résultats…";

    state.answers.prenom = prenom; state.answers.email = email;

    /* URL de résultats : clé spécifique au quiz si présente, sinon clé globale.
       Seuls sid, prenom et fbclid passent dans l'URL : la page de résultats
       récupère les réponses via la RPC quiz_get(sid). */
    const base = CONFIG["redirect_url_results_" + QUIZ.type] || CONFIG.redirect_url_results;
    const r = new URLSearchParams({ sid: sessionId, prenom: prenom });
    if (fbclid) r.set("fbclid", fbclid);
    const target = base + "?" + r.toString();

    trackLead();
    /* completed_at déclenche côté Supabase le webhook (table quiz_config, clé webhook_url)
       qui reçoit toute la ligne, redirect_url comprise */
    saveProgress(Object.assign({
      prenom, email,
      redirect_url: target,
      completed_at: new Date().toISOString()
    }, QUIZ.completionFields(state)));

    renderProcessing(target);
  });
}

/* ---------- Écran de processing avant la redirection ---------- */
function renderProcessing(target) {
  const steps = QUIZ.processingSteps || [
    { ico:"🔍", lbl:"Analyse des réponses" },
    { ico:"🧠", lbl:"Identification des schémas émotionnels" },
    { ico:"📊", lbl:"Matching avec des profils similaires" },
    { ico:"🎯", lbl:"Calcul de votre trajectoire personnalisée" },
    { ico:"✨", lbl:"Sélection de vos séances prioritaires" }
  ];
  document.body.classList.add("processing");
  btnBack.classList.remove("visible");
  window.scrollTo(0,0);
  app.className = "screen active";
  const R = 54, CIRC = 2 * Math.PI * R;
  app.innerHTML = `
    <div class="proc">
      <div class="proc-ring">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
          <circle id="procArc" cx="60" cy="60" r="${R}" fill="none" stroke="#7FC4A6" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/>
        </svg>
        <div class="pct" id="procPct">0%</div>
      </div>
      <h1>Analyse de votre <em>profil en cours</em></h1>
      <div class="sub">Veuillez patienter quelques secondes.<br>Vos résultats sont en cours de génération.</div>
      <div class="proc-steps">
        ${steps.map(s => `<div class="proc-step"><span class="ico">${s.ico}</span><span class="lbl">${s.lbl}${s.sub ? `<small>${s.sub}</small>` : ""}</span><span class="tick">✓</span></div>`).join("")}
      </div>
    </div>`;
  const arc = document.getElementById("procArc");
  const pctEl = document.getElementById("procPct");
  const els = [...document.querySelectorAll(".proc-step")];
  const DURATION = 7500;
  const t0 = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - t0) / DURATION);
    const eased = 1 - Math.pow(1 - t, 1.6);
    pctEl.textContent = Math.round(eased * 100) + "%";
    arc.style.strokeDashoffset = CIRC * (1 - eased);
    const seg = eased * steps.length;
    els.forEach((el, i) => {
      el.classList.toggle("done", seg >= i + 1);
      el.classList.toggle("active", seg >= i && seg < i + 1);
    });
    if (t < 1) requestAnimationFrame(frame);
    else setTimeout(() => { location.href = target; }, 450);
  }
  requestAnimationFrame(frame);
}

/* ---------- Init : chargement config puis démarrage ---------- */
(async function init(){
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/quiz_config?select=key,value", { headers: SB_HEADERS });
    if (res.ok) (await res.json()).forEach(row => { CONFIG[row.key] = row.value; });
  } catch(e) { /* on garde les valeurs par défaut */ }

  if (CONFIG.quiz_active === "false") {
    app.className = "center-msg";
    app.innerHTML = `<div style="font-family:'Cormorant Garamond',serif;font-size:26px;color:var(--forest)">Le bilan est momentanément indisponible</div><div>Revenez dans quelques instants.</div>`;
    return;
  }
  initPixel(CONFIG.pixel_id);
  render();
})();
