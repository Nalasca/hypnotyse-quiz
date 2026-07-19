# Brief : Quiz diagnostic Hypnotyse (diag.hypnotyse.com)

Contexte de passation pour Claude (Cowork / Claude Code). Ce fichier contient tout le contexte du chantier démarré sur claude.ai.

## Le projet

Hypnotyse (www.hypnotyse.com) vend des programmes d'autohypnose audio (créés par Didier Cantié, infirmier anesthésiste et hypnothérapeute) à des femmes de 40 à 65 ans en difficulté avec l'alimentation émotionnelle. Nouveau modèle : abonnement avec 7 jours d'essai gratuit (carte capturée à J0, prélèvement à J8), 29€/mois ou 108€/an (présenté 9€/mois). Tunnel : Meta Ad → LP Systeme.io → quiz diag.hypnotyse.com → page de vente personnalisée app.hypnotyse.com (Systeme.io) → commande.

Ce quiz remplace l'ancien formulaire Tally. Objectifs : s'affranchir de l'abonnement Tally, sauvegarde progressive des réponses, tracking propre, personnalisation de la page de vente via paramètres URL.

## État du chantier

- [x] Tables Supabase créées (projet `hypnotyse`, id `ydyogdzwdudmuzbpsozz`, eu-west-1)
- [x] `index.html` complet généré (ce dossier)
- [ ] Déploiement Vercel + domaine diag.hypnotyse.com (CNAME chez l'hébergeur DNS, pas de Cloudflare)
- [ ] Renseigner `pixel_id` dans la table `quiz_config`
- [ ] Brancher les vraies images silhouettes morphotypes (CDN Systeme.io, actuellement badges lettres V X I A H O)
- [ ] Créer la page de vente personnalisée sur app.hypnotyse.com qui lit les paramètres URL
- [ ] Webhook n8n : à la complétion du quiz, créer/mettre à jour le contact dans Systeme.io (tag quiz_complete)

## Supabase

- URL : https://ydyogdzwdudmuzbpsozz.supabase.co
- Clé publique (exposable côté navigateur) : sb_publishable_W8FTMb_XDkEKO4XbRRB7CQ_YJEURUS-
- Table `quiz_config` : clé/valeur, lecture publique, écriture dashboard uniquement. Clés : redirect_url_results, redirect_url_fallback, pixel_id, quiz_active. Toute modification est prise en compte au prochain chargement du quiz, sans redéploiement.
- Table `quiz_sessions` : RLS activé, insert/update anonymes, aucune lecture côté client. Sauvegarde progressive : `current_step` + jsonb `answers` à chaque réponse, colonnes promues (prenom, email, age, taille_cm, poids_actuel, poids_ideal, imc_actuel, imc_objectif, poids_recommande, morphotype, duree_tentative, objectif_vie, obstacle_percu, score_emotionnel, moment_ecoute, completed_at) + tracking (fbclid, utm_*, landing_variant), trigger updated_at, index sur created_at, email, current_step.

## Logique du quiz (index.html)

15 questions + 3 écrans de réassurance + capture email. Ordre : objectif kg, âge, taille, poids, poids idéal, [R1 faisabilité : IMC + poids d'équilibre calculés], durée des tentatives, projection objectif de vie (2 max), obstacle perçu, morphotype, symptômes, moments de grignotage, [R2 hormones et automatismes inconscients], 3 échelles 1-5 (sucre, stress/émotions, cercle de l'échec → somme = score_emotionnel), [R3 : 580 répondantes, vous n'êtes pas seule], temps dispo + moment d'écoute, email.

- session_id UUID généré côté client, persisté en localStorage (`hy_quiz_session`), insert Supabase au premier clic
- fbclid capturé depuis l'URL, persisté en localStorage (`hy_fbclid`), repassé à la redirection
- Pixel : PageView à l'init si pixel_id renseigné, QuizStart custom au premier clic, Lead avec eventID = session_id à la capture email (déduplication CAPI)
- Redirection finale vers redirect_url_results avec : sid, prenom, poids, ideal, aperdre, imc, reco, morpho, duree, vie, obstacle, score, moment, fbclid
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
