## TradeFlow

Next.js (App Router) + TypeScript + Tailwind + Prisma + Supabase.

### Env
- Copy the right env before running: `npm run env:use:local` or `npm run env:use:prod` (creates `.env`).
- Required: `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`.

### Migrations
```bash
npx prisma migrate dev --name remove_templates
npx prisma generate
```

### App
- `/quotes`: list
- `/quotes/new`: create quote manually
- `/quotes/[id]`: view; DRAFT shows edit link
- `/quotes/[id]/edit`: edit draft quote

Run locally:
```bash
npm install
npm run dev
```
