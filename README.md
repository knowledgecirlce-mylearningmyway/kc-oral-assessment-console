# Console d'évaluation orale KC - CCC CECR/CEFR

MVP interne React + TypeScript pour les évaluateurs et évaluatrices de français langue seconde de Knowledge Circle qui réalisent des évaluations orales CCC en direct sur Microsoft Teams.

## Ce Que Fait L'application

- Crée une nouvelle évaluation orale CCC en français.
- Affiche une structure d'évaluation orale en cinq étapes, avec une étape d'évaluation finale.
- Fournit des questions principales, des options plus faciles, des options plus avancées, des questions de relance et des points d'observation.
- Permet de sélectionner des cotes CECR/CEFR pour chaque critère.
- Suggère un niveau CECR/CEFR à partir des critères sélectionnés, tout en laissant le niveau final à l'évaluation de l'évaluateur ou de l'évaluatrice.
- Offre des notes structurées et des tags rapides pour consigner les observations.
- Génère un résumé CECR/CEFR modifiable et prêt à copier dans un rapport CCC.
- Sauvegarde et charge un brouillon local dans le navigateur avec `localStorage`.

## Comment Lancer L'application

Ce projet utilise React, TypeScript et Vite.

```bash
pnpm install
pnpm run build
pnpm run preview
```

Ouvrez ensuite l'URL locale affichée dans le terminal, normalement :

```text
http://127.0.0.1:4173
```

Dans cet espace Codex, Node est fourni par l'environnement intégré. Si `pnpm` n'est pas disponible dans votre PATH global, utilisez le runtime intégré ou ajoutez Node au PATH.

## Publication Sur GitHub Pages

Le projet contient un workflow GitHub Actions dans `.github/workflows/deploy.yml`.

Pour publier l'application :

1. Créez un nouveau dépôt GitHub, par exemple `kc-oral-assessment-console`.
2. Envoyez le projet sur GitHub.
3. Dans le dépôt GitHub, ouvrez `Settings` > `Pages`.
4. Dans `Build and deployment`, choisissez `GitHub Actions`.
5. Attendez que l'action `Deploy to GitHub Pages` se termine.
6. Partagez l'URL GitHub Pages avec l'équipe.

À ne pas envoyer manuellement sur GitHub :

- `node_modules/`
- `dist/`
- `.pnpm-store/`
- fichiers `.log`

Ces dossiers sont ignorés par `.gitignore`.

Important : si le dépôt ou le site GitHub Pages est public, ne pas entrer de vraies données de personnes candidates pendant les tests.

## Comment L'utiliser Pendant Une Évaluation

1. Ouvrir l'application dans une fenêtre de navigateur à côté de Microsoft Teams.
2. Entrer les renseignements de la personne candidate et de l'évaluateur ou de l'évaluatrice.
3. Naviguer dans les étapes à gauche.
4. Utiliser les questions et relances en français pendant l'échange oral.
5. Sélectionner les cotes CECR/CEFR dans le panneau de droite à mesure que les preuves émergent.
6. Ajouter des notes ou des tags rapides pendant ou immédiatement après l'évaluation.
7. Confirmer manuellement le niveau CECR/CEFR final.
8. Générer, modifier et copier le résumé dans le rapport CCC.

## Limites De Confidentialité Du MVP

Ce MVP est local seulement.

Il n'inclut pas :

- stockage serveur;
- connexion utilisateur;
- base de données;
- enregistrement audio;
- enregistrement vidéo;
- transcription;
- appels API externes;
- notation automatique.

Le brouillon local est stocké seulement dans le navigateur avec `localStorage`. Utilisez **Effacer** dans l'application pour supprimer l'évaluation en cours et le brouillon local de ce navigateur.
