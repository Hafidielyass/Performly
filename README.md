# Performly

Plateforme d'évaluation RH multi-boutiques pour une chaîne de retail marocaine (Patchi), en remplacement des
classeurs Excel existants. Phase 1 (MVP) : effectif par boutique, évaluations Gérant(e) (29
critères / 7 catégories) et Vendeur(se) (6 critères), scoring et recommandation RH automatiques,
suivi des plans d'action RH.

## Stack

- **Frontend** : Next.js (App Router) + TypeScript + Tailwind + shadcn/ui-style components + Recharts
- **Backend** : NestJS (REST API) + Prisma
- **Base de données** : PostgreSQL
- **Conteneurisation** : Docker / docker-compose

## Démarrage

Prérequis : Docker Desktop.

```bash
cp .env.example .env
docker-compose up --build
```

C'est tout. Le conteneur `backend` applique automatiquement les migrations Prisma (`prisma migrate
deploy`) puis exécute le seed (idempotent - il se désactive tout seul si la base contient déjà des
données) avant de démarrer l'API. Aucune commande manuelle n'est nécessaire pour un premier lancement.

- Frontend : http://localhost:3000
- API backend : http://localhost:3001
- Healthcheck backend : http://localhost:3001/health

### Comptes de démonstration (seed)

Mot de passe pour tous les comptes ci-dessous : `Password123!`

| Rôle | Email |
|---|---|
| Admin RH | admin@performly.local |
| Directeur Régional | directeur@performly.local |
| Gérant(e) — Ghandi | gerant.ghandi@performly.local |
| Gérant(e) — Oasis | gerant.oasis@performly.local |
| Gérant(e) — Marrakech | gerant.marrakech@performly.local |
| Gérant(e) — Rabat | gerant.rabat@performly.local |
| Gérant(e) — Racine | gerant.racine@performly.local |

### Relancer le seed manuellement

Le seed ne s'exécute qu'une fois (il se désactive dès que la table `boutiques` n'est plus vide).
Pour le relancer sur une base vide :

```bash
docker-compose exec backend node dist/prisma/seed.js
```

### Développement local sans Docker (optionnel)

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run prisma:seed
npm run start:dev

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

## Déploiement en production

Le backend **refuse de démarrer** si `NODE_ENV=production` et qu'une variable requise manque ou
qu'un des secrets de développement par défaut (`change_me_dev_*`) est encore utilisé. Un serveur
de production requiert donc :

1. **Des secrets aléatoires forts** pour `JWT_SECRET` et `JWT_REFRESH_SECRET`
   (ex. `openssl rand -hex 32`), un mot de passe Postgres dédié, et des valeurs réelles pour
   `DATABASE_URL`.
2. **Les URLs réelles du frontend** : `CORS_ORIGIN` = domaine(s) servis en HTTPS (liste séparée
   par des virgules), `NEXT_PUBLIC_API_URL` = URL HTTPS de l'API. Le backend refuse de démarrer
   sans `CORS_ORIGIN` - il n'y a pas de repli « autoriser toutes les origines ».
3. **`TRUST_PROXY=1`** quand l'API est derrière un reverse proxy / load balancer (nginx, Traefik,
   PaaS) pour que la limitation de débit (`@nestjs/throttler`) identifie chaque client par son
   IP réelle (`X-Forwarded-For`) et non l'IP du proxy.
4. **TLS** terminé par le proxy devant le frontend (https) — le cookie de rafraîchissement est
   `secure` dès que `NODE_ENV=production`.
5. **Ne pas exposer Postgres publiquement** : retirez le bloc `ports` du service `postgres`
   du compose (ou utilisez un network interne) — seul le trafic entre conteneurs doit
   l'atteindre.

Déploiement minimal :

```bash
NODE_ENV=production \
JWT_SECRET=$(openssl rand -hex 32) \
JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
CORS_ORIGIN=https://rh.example.com \
NEXT_PUBLIC_API_URL=https://rh.example.com/api \
TRUST_PROXY=1 \
docker compose up -d --build
```

Le conteneur backend applique les migrations (`prisma migrate deploy`) et exécute le seed
idempotent à chaque démarrage, puis ne se déclare *healthy* (`/health`) que si PostgreSQL répond.
Sauvegardez le volume `postgres_data` (`pg_dump`) avant toute mise à jour.

## Tests

Le moteur de scoring (`backend/src/scoring`) a une couverture de tests unitaires complète, y
compris toutes les bornes des barèmes de notation :

```bash
cd backend
npm test
```

## Feuille de route

1. **Phase 1 (ce dépôt)** : effectif, évaluations, scoring, tableau de bord, plans d'action RH.
2. **Phase 2** : exports Excel/PDF consolidés, notifications (file d'attente à câbler), interface du
   journal d'audit, tendances historiques.
3. **Phase 3** : à définir avec les retours terrain de la Phase 1/2.

## Structure du dépôt

```
backend/    API NestJS + schéma Prisma + moteur de scoring + tests
frontend/   Application Next.js (App Router)
docker-compose.yml
.env.example
```
