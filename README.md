# ZAHOOR – Online clothing store (Next.js)

Women / Men / Kids fashion store with mega-menu, collections, filters, size selection, customer accounts,
saved carts, guest + signed-in checkout, order tracking and an admin panel.

## Setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, AUTH_SECRET, Cloudinary keys
npm run db:push           # creates / updates tables (use a fresh database, see note below)
npm run db:seed           # creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev
```

- Admin panel: `/admin` (add products with photos, sizes, colours, prices).
- Customers: `/register`, `/login`, `/account`. Guests can also shop and check out.

> **Database note:** the old watch columns (brand, movement, case size...) are replaced by clothing fields
> (section, category, fabric, fit, sizes...). Use a **new / empty database**, or accept the column drops
> when `drizzle-kit push` asks. Old watch products will not carry over.

## Where to edit things

| What | File |
| --- | --- |
| Store name, phone, free-delivery rule, sizes | `src/lib/config.ts` |
| Menu / categories (Men, Women, Kids) | `src/lib/taxonomy.ts` |
| Home page banners (text, colours, photos) | `src/lib/banners.ts` |
| Footer help pages (FAQ, shipping, returns...) | `src/lib/pages.ts` |
| Colours / fonts | `src/app/globals.css`, `src/app/layout.tsx` |

## Performance notes

- Navigation is static (no DB). Catalog is one cached query (1 hour, refreshed instantly on admin save or new order).
- Filters, search and sorting run in memory on that cached catalog.
- Navbar cart count and "Hi, Name" come from small cookies, so pages stay cached.
- Guest cart = cookie. Signed-in cart = database row set (merged on login).
