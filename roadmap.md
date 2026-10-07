# Roadmap

- [x] Validate the single existing settings row and auth user.
- [x] Create the additive multi-tenant schema and indexes.
- [x] Seed the first business, owner membership, and platform administrator.
- [x] Backfill every current restaurant-scoped record without deleting data.
- [x] Validate counts, constraints, indexes, trigger, and application compilation.
- [x] Adapt reads and writes to tenant scope, including public slug menus and tenant-bound orders.
- [x] Replace broad access policies and anonymous order access with tenant isolation.
- [x] Apply authenticated RLS to ordinary admin reads and writes.
- [x] Validate public checkout and WhatsApp redirect, authenticated admin access, transaction-reverted tenant/platform isolation, counts, compilation, and runtime; stop after Phase C.