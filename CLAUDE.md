# Brief : Quiz diagnostic Hypnotyse (diag.hypnotyse.com)

Contexte de passation pour Claude (Cowork / Claude Code). Ce fichier contient tout le contexte du chantier démarré sur claude.ai.

## Le projet

Hypnotyse (www.hypnotyse.com) vend des programmes d'autohypnose audio (créés par Didier Cantié, infirmier anesthésiste et hypnothérapeute) à des femmes de 40 à 65 ans en difficulté avec l'alimentation émotionnelle. Nouveau modèle : abonnement avec 7 jours d'essai gratuit (carte capturée à J0, prélèvement à J8), 29€/mois ou 108€/an (présenté 9€/mois). Tunnel : Meta Ad → LP Systeme.io → quiz diag.hypnotyse.com → page de vente personnalisée app.hypnotyse.com (Systeme.io) → commande.

Ce quiz remplace l'ancien formulaire Tally. Objectifs : s'affranchir de l'abonnement Tally, sauvegarde progressive des réponses, tracking propre, personnalisation de la page de vente via paramètres URL.

## État du chantier

- [x] Tables Supabase créées (projet `hypnotyse`, id `ydyogdzwdudmuzbpsozz`, eu-west-1)
- [x] Repo GitHub `Nalasca/hypnotyse-quiz` (push SSH), le quiz vit sur `/poids` (futurs quiz : tabac/, sommeil/...)
- [x] Code découpé : `assets/styles.css` + `assets/engine.js` (moteur générique) + `poids/quiz.js` (questions et calculs) + `poids/index.html` (coquille)
- [x] Question Femme/Homme en Q2, poids d'équilibre par formule de Lorentz selon le sexe, textes R3 adaptés
- [x] Persistance via RPC `quiz_save` (upsert security definer), testée de bout en bout
- [x] Trigger webhook à la complétion (pg_net), testé : POST de la ligne complète (redirect_url comprise) vers `webhook_url` de `quiz_config`
- [ ] Import du repo dans Vercel + domaine diag.hypnotyse.com (CNAME `diag` → cname.vercel-dns.com chez l'hébergeur DNS, pas de Cloudflare)
- [ ] Renseigner `pixel_id` et `webhook_url` dans la table `quiz_config`
- [ ] Brancher les vraies images silhouettes morphotypes (CDN Systeme.io, actuellement badges lettres V X I A H O)
- [ ] Créer la page de vente personnalisée sur app.hypnotyse.com qui lit les paramètres URL
- [ ] Webhook n8n : recevoir le POST de complétion, créer/mettre à jour le contact dans Systeme.io (tag quiz_complete)

## Supabase

- URL : https://ydyogdzwdudmuzbpsozz.supabase.co
- Clé publique (exposable côté navigateur) : sb_publishable_W8FTMb_XDkEKO4XbRRB7CQ_YJEURUS- (header `apikey` seul, jamais en `Authorization: Bearer`)
- Table `quiz_config` : clé/valeur, lecture publique, écriture dashboard uniquement. Clés : redirect_url_results, redirect_url_fallback, pixel_id, quiz_active, webhook_url. Le moteur cherche aussi `redirect_url_results_<quiz_type>` (ex. redirect_url_results_poids) avant la clé globale. Toute modification est prise en compte au prochain chargement du quiz, sans redéploiement.
- Table `quiz_sessions` : RLS activé, AUCUN accès direct anonyme (ni lecture ni écriture). Toute la persistance passe par la RPC `quiz_save(p_id uuid, p_fields jsonb)` (security definer, upsert, whitelist de colonnes). Piège RLS documenté : un UPDATE anonyme avec WHERE sur id exige une policy SELECT, d'où la RPC. Colonnes : `current_step` + jsonb `answers` à chaque réponse, colonnes promues (prenom, email, sexe, age, taille_cm, poids_actuel, poids_ideal, imc_actuel, imc_objectif, poids_recommande, morphotype, duree_tentative, objectif_vie, obstacle_percu, score_emotionnel, moment_ecoute, completed_at, redirect_url, quiz_type) + tracking (fbclid, utm_*, landing_variant), trigger updated_at, index sur created_at, email, current_step.
- Trigger `trg_quiz_completed` : quand `completed_at` passe de null à renseigné, `notify_quiz_completed()` POST la ligne complète en JSON (redirect_url comprise) vers la valeur de `webhook_url` via pg_net. Vide = désactivé. Se déclenche côté serveur, insensible aux bloqueurs de pub et aux fermetures d'onglet.

## Architecture du code

- `assets/styles.css` : design system partagé par tous les quiz
- `assets/engine.js` : moteur générique (config, session, RPC quiz_save, pixel, rendus single/multi/number/scale/email, navigation). Lit `window.QUIZ`.
- `poids/quiz.js` : définition du quiz poids (étapes, calculs, écrans custom rea1/rea2/rea3/rythme, completionFields, redirectParams)
- `poids/index.html` : coquille HTML qui charge quiz.js puis engine.js
- `vercel.json` : redirection `/` → `/poids`
- Nouveau quiz = un dossier (tabac/, sommeil/...) avec index.html + quiz.js, le moteur est réutilisé tel quel

## Logique du quiz poids

16 questions + 3 écrans de réassurance + capture email. Ordre : objectif kg, sexe (Femme/Homme), âge, taille, poids, poids idéal, [R1 faisabilité : IMC + poids d'équilibre Lorentz selon sexe], durée des tentatives, projection objectif de vie (2 max), obstacle perçu, morphotype, symptômes, moments de grignotage, [R2 hormones et automatismes inconscients], 3 échelles 1-5 (sucre, stress/émotions, cercle de l'échec → somme = score_emotionnel), [R3 : 580 répondantes, vous n'êtes pas seule ; textes adaptés si Homme], temps dispo + moment d'écoute, email.

- session_id UUID généré côté client, persisté en localStorage (`hy_quiz_session_poids`, une clé par quiz_type) seulement après le premier enregistrement réussi ; retente à chaque réponse sinon
- fbclid capturé depuis l'URL, persisté en localStorage (`hy_fbclid`), repassé à la redirection
- Pixel : PageView à l'init si pixel_id renseigné, QuizStart custom au premier clic, Lead avec eventID = session_id à la capture email (déduplication CAPI)
- Redirection finale vers redirect_url_results avec uniquement : sid, prenom, fbclid. La page de résultats récupère les réponses via la RPC `quiz_get(p_id uuid)` (security definer, renvoie les champs de personnalisation en jsonb, jamais l'email ni le tracking). La même URL est stockée en colonne `redirect_url` et part dans le webhook.
- Question schizophrénie/troubles psychiques sortie du parcours : mention légale sous le formulaire email
- Copie sans termes interdits Meta (pas de "ménopause", dire "changements hormonaux" ; pas de promesse chiffrée de perte de poids)

## Design system Hypnotyse

Couleurs : forest #1E3A2F, green #2E7D5E, light green #7FC4A6, fond vert #E8F2EE, cream #F7F3ED, texte #1A2E24, muted #4A5E54, labels #8A9E96, red #C44A3A, orange #C8784A, gold #E8A020. Fonts : Cormorant Garamond (titres, italique pour les mots accentués), Inter (corps et chiffres). Mobile-first, max-width 720px, body 16px minimum, titres 28px+ sur mobile. Jamais de tiret cadratin dans les textes.

## Déploiement Vercel

1. `vercel deploy` depuis ce dossier (projet statique, index.html à la racine) ou glisser-déposer sur vercel.com
2. Ajouter le domaine diag.hypnotyse.com dans le projet Vercel
3. Chez l'hébergeur DNS : CNAME `diag` → `cname.vercel-dns.com`
4. Tester le parcours complet, vérifier les lignes dans quiz_sessions, puis renseigner pixel_id dans quiz_config

## Style de travail de Nico

Direct, itératif, corrections ciblées. Ton français naturel, tutoiement, phrases fluides, pas de listes à rallonge. Jamais de tirets cadratins.
