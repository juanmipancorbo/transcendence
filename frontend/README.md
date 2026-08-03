# ft_transcendance – Frontend

> Velocity Noir design system · Next.js 14 · TypeScript · Tailwind CSS


## Getting started

```bash
cd frontend
cp .env.example .env         # set API + WS URLs
npm install
npm run dev                   # http://localhost:3000
```

## Project structure

```
frontend/
├── app/                   # Next.js App Router pages
│   ├── layout.tsx         # Root layout – AuthProvider + fonts
│   ├── page.tsx           # / → redirects to /login or /lobby
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── lobby/page.tsx     # Matchmaking
│   ├── game/page.tsx      # Live game board
│   ├── profile/page.tsx   # User profile + edit
│   ├── leaderboard/page.tsx
│   └── terms/page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── ProtectedLayout.tsx   # Redirect guard for auth pages
│   ├── game/
│   │   ├── GameBoard.tsx         # 8×8 grid renderer
│   │   └── BoardCell.tsx         # Single cell with piece + valid-move hints
│   └── auth/                     # (reserved for future auth components)
├── hooks/
│   ├── useAuth.tsx        # Auth context (login / register / logout)
│   └── useGame.ts         # WebSocket game state hook
├── lib/
│   ├── api.ts             # Typed REST client with JWT + auto-refresh
│   ├── socket.ts          # GameSocket class (typed WS with reconnect)
│   └── utils.ts           # cn() helper
├── types/
│   └── index.ts           # Shared TypeScript types (User, GameState, WS…)
├── styles/
│   └── globals.css        # Velocity Noir CSS variables + component layer
├── tailwind.config.ts     # All design tokens as Tailwind extensions
└── next.config.ts         # API proxy rewrite + image domains
```

## Design system: Velocity Noir

All tokens live in two places:
- **`styles/globals.css`** – CSS custom properties for use in inline styles
- **`tailwind.config.ts`** – Tailwind extensions for use in class names

