# AGENTS.md — joutio-web-console

Console d'exploitation (admin, `console.joutio.com`) :
- **Axon** : applications, processors et segments, messages, événements planifiés, recherche
  dans l'event store, DLQ, audit ;
- **modération** : questions et signalements, sujets (officiel, fermeture), joueurs (suspension,
  Premium manuel), contenus illicites ;
- **médias** MinIO.

Lire : `../../AGENTS.md`, [`docs/frontend/`](../../docs/frontend/architecture.md), les API consommées :
`services/joutio-console/AGENTS.md` et [`docs/api/admin.md`](../../docs/api/admin.md).

## Particularités

- Pas de lab : design maison sur shadcn (preset Base UI `base-luma`), primitives dans
  `components/ui/`, graphiques `recharts`.
- Auth : `oidc-client-ts` (Authorization Code + PKCE, renouvellement silencieux `/silent-callback`),
  client public `console`.
- **`AdminGate`** : session valide **et** `ROLE_ADMIN` dans `roles`, sinon `/login` ou « Accès
  refusé ». Ce n'est qu'un confort d'UX : chaque API revérifie le rôle.
- **Deux clients HTTP** :
  - `lib/api-client.ts` → `joutio-console` (`VITE_API_URL`) ;
  - `lib/bff-api.ts` → surfaces admin du BFF (`VITE_BFF_URL`, CORS du SDK).
- Les badges de navigation (signalements ouverts, contenus à traiter) se relisent toutes les 60 s.

## Structure

```
src/
  features/  auth, shell, dashboard, applications, processors, messages, scheduled, search, dlq,
             media, questions, content-moderation, user-moderation, users, audit
             (chaque feature : hooks/ lib/ pages/ index.ts ; imports internes interdits par ESLint)
  lib/       api-client, bff-api, api, config, endpoints, metrics (Prometheus), query-keys, session, format
  routes/    AppRoutes (pages lazy derrière AdminGate + AppShell)
  shared/    DataState, Modal, PageHeader, Pagination, SegmentedTabs, StatCard, TimeSeriesChart, JsonViewer…
  components/ui/  primitives shadcn
```

**Routes** :
- publiques : `/login`, `/callback`, `/silent-callback` ;
- sous garde admin :
  - Axon : `/` (tableau de bord), `/applications[/:application]`, `/processors[/…]`, `/commands`,
    `/queries`, `/scheduled-events`, `/search`, `/dlq[/…]` ;
  - modération : `/questions[/:id]` (Signalements, Catalogue), `/topics`, `/content-notices`,
    `/user-reports[/:userId]` (Signalements, Catalogue des joueurs) ;
  - médias, utilisateurs et audit : `/media`, `/users`, `/audit`.

**Règles d'écran** :
- un média référencé ne se supprime qu'avec une confirmation « forcer » ;
- la suspension d'un joueur choisit un motif groupé, une durée (1 h à 1 an, personnalisée ou
  définitive) et une note **interne** ;
- un contenu illicite se retire depuis Sujets, Médias ou Questions, puis la décision motivée
  s'enregistre.

## Configuration

| Variable | Dev | Prod |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8094` | `https://console.joutio.com` |
| `VITE_BFF_URL` | `http://localhost:8092` | `https://api.joutio.com` |
| `VITE_OIDC_AUTHORITY` | `http://localhost:8085` | `https://identity.joutio.com` |
| `VITE_OIDC_CLIENT_ID` | `console` | `console` |
| `VITE_OIDC_REDIRECT_URI` | `http://localhost:5174/callback` | `https://console.joutio.com/callback` |

## Commandes

```bash
npm install
npm run dev          # http://localhost:5174
npm run typecheck && npm run lint && npm run test && npm run build
```

Déploiement : `frontend-release.yml`, puis `devops/joutio-gitops/apps/joutio-web-console/`. L'ingress
est partagé avec `joutio-console` (`/` → SPA, `/api/console` → API).
