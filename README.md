# WikiFiction

Jeu de cartes à collectionner, un TCG par univers de fiction. Les cartes sont générées à partir des wikis Fandom.

On peut jouer en invité (progression gardée dans le navigateur) ou se connecter par lien e-mail pour retrouver sa collection sur tous ses appareils.

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs Supabase (facultatif)
npm run dev                  # http://localhost:5173
```

## Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécuter `supabase/schema.sql`.
3. Dans **Authentication > URL Configuration** :
   - *Site URL* : l'adresse du site publié, par ex. `https://<utilisateur>.github.io/<dépôt>/` ;
   - *Redirect URLs* : ajouter cette même adresse et `http://localhost:5173/`.
4. Récupérer l'URL du projet et la clé `anon` dans **Project Settings > API**. La clé `anon` est publique par conception : les règles d'accès (RLS) du schéma empêchent chaque joueur de lire ou modifier les collections des autres.

Le service d'e-mail intégré de Supabase est limité à quelques envois par heure. Au-delà de quelques joueurs, brancher un SMTP (Resend, Brevo…) dans **Authentication > Emails > SMTP Settings**.

## Publier sur GitHub Pages

1. Pousser le projet dans un dépôt GitHub (branche `main`).
2. Dans **Settings > Pages**, choisir *Source : GitHub Actions*.
3. Dans **Settings > Secrets and variables > Actions > Variables**, créer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
4. Chaque push sur `main` publie le site via `.github/workflows/deploy.yml`.

## Régénérer les cartes

```bash
npm run cards                 # tous les univers
npm run cards -- got          # un seul univers
npm run cards -- got --stats  # aperçu du classement, sans écrire de fichier
```

Les réponses des wikis sont mises en cache dans `.cache/` ; supprimer ce dossier pour repartir des données à jour.

## Ajouter un univers

1. Ajouter sa configuration de génération dans `scripts/universes.mjs` (wiki, catégories de départ, règles de type).
2. Ajouter son nom, ses libellés de types et son thème dans `src/universes.ts`.
3. Lancer `npm run cards -- <id>`.
