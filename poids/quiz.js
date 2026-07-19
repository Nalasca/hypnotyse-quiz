/* ============================================================
   Quiz poids : définition des étapes et calculs spécifiques.
   Chargé avant assets/engine.js qui lit window.QUIZ.
   ============================================================ */
(function(){

  /* ---------- Calculs ---------- */
  /* Poids d'équilibre selon la formule de Lorentz, qui tient compte du sexe */
  function poidsEquilibre(state) {
    const t = Number(state.answers.taille_cm) || 0;
    if (!t) return null;
    const homme = state.answers.sexe === "Homme";
    return Math.round(homme ? t - 100 - (t - 150) / 4 : t - 100 - (t - 150) / 2.5);
  }

  function calc(state) {
    const t = Number(state.answers.taille_cm) || 0;
    const p = Number(state.answers.poids_actuel) || 0;
    const pi = Number(state.answers.poids_ideal) || 0;
    const h2 = (t/100)*(t/100);
    return {
      imc: h2 ? +(p/h2).toFixed(1) : null,
      imcObjectif: h2 ? +(pi/h2).toFixed(1) : null,
      pReco: poidsEquilibre(state),
      pRecoBas: h2 ? Math.round(18.5*h2) : null,
      aPerdre: (p && pi) ? +(p-pi).toFixed(1) : null
    };
  }

  function scoreEmotionnel(state) {
    return (Number(state.answers.sucre)||0) + (Number(state.answers.stress)||0) + (Number(state.answers.echec)||0);
  }

  function estHomme(state) { return state.answers.sexe === "Homme"; }

  /* ---------- Écrans de réassurance ---------- */
  function renderRea1(ctx) {
    const c = calc(ctx.state);
    const objectifOk = c.pRecoBas === null || Number(ctx.state.answers.poids_ideal) >= c.pRecoBas;
    ctx.app.innerHTML = `
      <div class="rea-icon">🌿</div>
      <div class="eyebrow">Votre profil se dessine</div>
      <h1>Votre objectif est <em>${objectifOk ? "réaliste" : "ambitieux"}</em></h1>
      <div class="sub">Voici ce que révèlent vos premières réponses.</div>
      <div class="cards">
        <div class="card"><div class="v">${c.imc ?? "–"}</div><div class="k">IMC actuel</div></div>
        <div class="card"><div class="v accent">&minus;${c.aPerdre ?? "–"} kg</div><div class="k">Votre objectif</div></div>
      </div>
      <div class="rea-note">${objectifOk
        ? `<strong>Bonne nouvelle :</strong> votre objectif de ${ctx.esc(ctx.state.answers.poids_ideal)} kg est cohérent avec votre profil. Avec la bonne méthode, il est atteignable durablement, sans frustration.`
        : `Votre objectif est en dessous de votre poids d'équilibre estimé. Nous vous accompagnerons vers un poids durable et bon pour votre santé, autour de ${c.pRecoBas} kg minimum.`}
      </div>
      <button class="cta green" id="btnNext">Continuer mon bilan</button>`;
    document.getElementById("btnNext").addEventListener("click", () => ctx.next());
  }

  function renderRea2(ctx) {
    const age40 = (Number(ctx.state.answers.age) || 0) >= 40;
    ctx.app.innerHTML = `
      <div class="rea-icon">🧠</div>
      <div class="eyebrow">Ce que les régimes ignorent</div>
      <h1>Ce n'est pas un manque de <em>volonté</em></h1>
      <div class="rea-note" style="margin-bottom:14px">
        ${age40
          ? `Après 40 ans, les <strong>changements hormonaux</strong> modifient la façon dont votre corps stocke et brûle les calories. Et vos envies de grignoter ne viennent pas de votre volonté : elles viennent d'<strong>automatismes inconscients</strong> installés depuis des années.`
          : `Vos envies de grignoter ne viennent pas de votre volonté : elles viennent d'<strong>automatismes inconscients</strong> installés depuis des années. Votre cerveau a appris à associer émotions et nourriture, et il rejoue ce programme sans vous demander votre avis.`}
      </div>
      <div class="rea-note">
        C'est exactement pour cela que les régimes échouent : ils s'attaquent à l'assiette, jamais à ce qui se passe dans votre tête. <strong>L'autohypnose agit là où tout se joue.</strong>
      </div>
      <button class="cta green" id="btnNext">Je comprends, continuer</button>`;
    document.getElementById("btnNext").addEventListener("click", () => ctx.next());
  }

  function renderRea3(ctx) {
    const homme = estHomme(ctx.state);
    ctx.app.innerHTML = `
      <div class="rea-icon">🤝</div>
      <div class="eyebrow">Vous n'êtes pas ${homme ? "seul" : "seule"}</div>
      <h1>${homme ? "D'autres vivent" : "Elles vivent"} <em>exactement</em> la même chose</h1>
      <div class="sub">Parmi les ${homme ? "personnes" : "femmes"} qui ont réalisé ce bilan avant vous :</div>
      <div class="stat-box">
        <div class="stat-line"><div class="n">580</div><div class="t">${homme ? "personnes ont" : "femmes ont"} déjà réalisé ce bilan personnalisé</div></div>
        <div class="stat-line"><div class="n">7/10</div><div class="t">essaient de perdre du poids depuis plus d'un an</div></div>
        <div class="stat-line"><div class="n">N°1</div><div class="t">leur blocage principal : manger sous le coup des émotions</div></div>
      </div>
      <div class="rea-note">Leur premier souhait n'est pas de rentrer dans une taille en dessous. C'est de retrouver <strong>une relation saine et apaisée avec la nourriture</strong>.</div>
      <button class="cta green" id="btnNext">Voir les dernières questions</button>`;
    document.getElementById("btnNext").addEventListener("click", () => ctx.next());
  }

  function renderRythme(ctx) {
    ctx.app.innerHTML = `
      <div class="eyebrow">Votre bilan personnalisé</div>
      <h1>Dernière étape : votre <em>rythme</em> idéal</h1>
      <div class="sub">Pour construire un programme qui s'adapte à votre quotidien.</div>
      <div class="group-label">Temps disponible chaque jour</div>
      <div class="options" id="optsTemps"></div>
      <div class="group-label">Meilleur moment pour écouter votre séance</div>
      <div class="options" id="optsMoment"></div>
      <button class="cta" id="btnNext" disabled>Continuer</button>`;
    const temps = ["10 minutes","20 minutes","30 minutes ou plus"];
    const moments = ["Le matin au réveil","Dans la journée","Le soir au coucher"];
    const btnNext = document.getElementById("btnNext");
    const st = ctx.state;
    function makeGroup(containerId, list, key) {
      const box = document.getElementById(containerId);
      list.forEach(o => {
        const b = document.createElement("button");
        b.className = "opt" + (st.answers[key] === o ? " selected" : "");
        b.innerHTML = `<span class="check"></span><span>${ctx.esc(o)}</span>`;
        b.addEventListener("click", () => {
          box.querySelectorAll(".opt").forEach(x => x.classList.remove("selected"));
          b.classList.add("selected");
          st.answers[key] = o;
          btnNext.disabled = !(st.answers.temps_dispo && st.answers.moment_ecoute);
        });
        box.appendChild(b);
      });
    }
    makeGroup("optsTemps", temps, "temps_dispo");
    makeGroup("optsMoment", moments, "moment_ecoute");
    btnNext.disabled = !(st.answers.temps_dispo && st.answers.moment_ecoute);
    btnNext.addEventListener("click", () => ctx.next({ moment_ecoute: st.answers.moment_ecoute }));
  }

  /* ---------- Étapes ---------- */
  const STEPS = [
    { id:"objectif", type:"single", q:1,
      title:"Quel est votre <em>objectif</em> de perte de poids ?",
      key:"objectif_kg",
      options:["Moins de 5 kg","5 à 10 kg","10 à 15 kg","Plus de 15 kg"] },

    { id:"sexe", type:"single", q:2, promote:true,
      title:"Vous êtes…",
      sub:"Le métabolisme diffère selon le sexe. Cette information affine le calcul de votre profil.",
      key:"sexe",
      options:["Femme","Homme"] },

    { id:"age", type:"number", q:3,
      title:"Quel est votre âge ?",
      sub:"Votre profil hormonal dépend de votre âge. Il influence directement la façon dont votre corps stocke et brûle les calories.",
      key:"age", unit:"ans", min:18, max:95, placeholder:"52", promote:true },

    { id:"taille", type:"number", q:4,
      title:"Quelle est votre taille ?",
      key:"taille_cm", unit:"cm", min:120, max:220, placeholder:"165", promote:true },

    { id:"poids", type:"number", q:5,
      title:"Quel est votre poids actuel ?",
      sub:"Cette information reste strictement confidentielle. Elle sert uniquement à calculer votre profil.",
      key:"poids_actuel", unit:"kg", min:40, max:250, decimal:true, placeholder:"72", promote:true },

    { id:"ideal", type:"number", q:6,
      title:"Quel poids aimeriez-vous <em>atteindre</em> ?",
      key:"poids_ideal", unit:"kg", min:40, max:250, decimal:true, placeholder:"63", promote:true,
      validate:(v, state) => (state.answers.poids_actuel && v >= Number(state.answers.poids_actuel))
        ? "Votre poids idéal doit être inférieur à votre poids actuel." : null,
      onAnswer:(v, state) => {
        const c = calc(state);
        return { imc_actuel: c.imc, imc_objectif: c.imcObjectif, poids_recommande: c.pReco };
      } },

    { id:"rea1", type:"custom", rea:true, render:renderRea1 },

    { id:"duree", type:"single", q:7, promote:true,
      title:"Depuis combien de temps essayez-vous de perdre du poids ?",
      key:"duree_tentative",
      options:["Moins de 6 mois","Entre 6 mois et 1 an","Entre 1 et 3 ans","Plus de 3 ans"] },

    { id:"projection", type:"multi", q:8, max:2, promote:true,
      title:"Une fois votre poids idéal atteint, <em>qu'est-ce qui changera</em> le plus pour vous ?",
      sub:"2 réponses maximum.",
      key:"objectif_vie",
      options:[
        "Une amélioration de ma santé et de ma forme physique",
        "Pouvoir reporter mes vêtements préférés",
        "Être plus à l'aise face au regard des autres",
        "Une relation saine et apaisée avec la nourriture",
        "Plus de confiance dans mes relations personnelles et intimes"
      ] },

    { id:"obstacle", type:"single", q:9, promote:true,
      title:"Selon vous, qu'est-ce qui vous <em>empêche</em> aujourd'hui d'y arriver ?",
      key:"obstacle_percu",
      options:[
        "Le grignotage et les envies incontrôlables",
        "Le manque de motivation qui s'essouffle",
        "Le stress et les émotions qui prennent le dessus",
        "Les régimes qui ne tiennent jamais sur la durée",
        "Je ne sais pas vraiment, et c'est ça le problème"
      ] },

    { id:"morphotype", type:"single", q:10, morpho:true, promote:true,
      title:"Quelle silhouette vous décrit le mieux ?",
      key:"morphotype",
      options:[
        {v:"V", t:"Épaules plus larges que les hanches"},
        {v:"X", t:"Épaules et hanches alignées, taille marquée"},
        {v:"I", t:"Silhouette fine et longiligne"},
        {v:"A", t:"Hanches plus larges que les épaules"},
        {v:"H", t:"Épaules et hanches alignées, taille peu marquée"},
        {v:"O", t:"Silhouette toute en rondeurs"}
      ] },

    { id:"symptomes", type:"multi", q:11, max:6,
      title:"Quels symptômes ressentez-vous habituellement ?",
      sub:"Plusieurs réponses possibles.",
      key:"symptomes",
      options:[
        "Fatigue fréquente ou manque d'énergie",
        "Ballonnements, digestion difficile",
        "Sommeil perturbé",
        "Douleurs articulaires",
        "Fringales soudaines",
        "Aucun en particulier"
      ] },

    { id:"moments", type:"multi", q:12, max:5,
      title:"À quels moments ressentez-vous le besoin de <em>grignoter</em> ?",
      sub:"Plusieurs réponses possibles.",
      key:"moments_grignotage",
      options:[
        "Dans la matinée",
        "Dans l'après-midi",
        "Le soir devant la télévision",
        "Tard le soir ou la nuit",
        "Je ne grignote presque jamais"
      ] },

    { id:"rea2", type:"custom", rea:true, render:renderRea2 },

    { id:"sucre", type:"scale", q:13,
      title:"« J'ai du mal à résister aux envies de sucre ou de chocolat. »",
      key:"sucre" },

    { id:"stress", type:"scale", q:14,
      title:"« Je mange souvent à cause du stress, de l'ennui ou d'émotions négatives. »",
      key:"stress" },

    { id:"echec", type:"scale", q:15,
      title:"« Quand je fais un écart, le sentiment d'échec me pousse à en faire encore plus. »",
      key:"echec",
      onAnswer:(v, state) => ({ score_emotionnel: scoreEmotionnel(state) }) },

    { id:"rea3", type:"custom", rea:true, render:renderRea3 },

    { id:"rythme", type:"custom", q:16, render:renderRythme },

    { id:"email", type:"email" }
  ];

  /* ---------- Définition lue par le moteur ---------- */
  window.QUIZ = {
    type: "poids",
    totalQuestions: 16,
    steps: STEPS,

    /* Écran de processing affiché après la capture email, avant la redirection */
    processingSteps: [
      { ico:"🔍", lbl:"Analyse des réponses" },
      { ico:"🧠", lbl:"Identification des schémas émotionnels" },
      { ico:"📊", lbl:"Matching avec des profils similaires" },
      { ico:"🎯", lbl:"Calcul de votre trajectoire personnalisée", sub:"Objectif, durée estimée, taux de réussite" },
      { ico:"✨", lbl:"Sélection de vos séances prioritaires", sub:"Adaptées à votre rythme et vos moments d'écoute" }
    ],

    /* Colonnes promues au moment de la complétion (en plus de prenom, email,
       redirect_url et completed_at gérés par le moteur) */
    completionFields(state) {
      const c = calc(state);
      return {
        sexe: state.answers.sexe || null,
        age: Number(state.answers.age) || null,
        taille_cm: Number(state.answers.taille_cm) || null,
        poids_actuel: state.answers.poids_actuel ?? null,
        poids_ideal: state.answers.poids_ideal ?? null,
        imc_actuel: c.imc, imc_objectif: c.imcObjectif, poids_recommande: c.pReco,
        morphotype: state.answers.morphotype || null,
        duree_tentative: state.answers.duree_tentative || null,
        objectif_vie: [].concat(state.answers.objectif_vie || []).join(" | ") || null,
        obstacle_percu: state.answers.obstacle_percu || null,
        score_emotionnel: scoreEmotionnel(state),
        moment_ecoute: state.answers.moment_ecoute || null
      };
    }
  };
})();
