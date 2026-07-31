# Supabase, Prisma, and Vercel setup

The application now uses PostgreSQL through Prisma's `pg` adapter. The local XAMPP MySQL database is not used after this migration.

## 1. Create the Supabase project

1. Open [supabase.com](https://supabase.com) and create a new project.
2. Choose a strong database password and save it securely.
3. Open **Project Settings > Database > Connection string**.
4. Copy both values:
   - **Session pooler** connection string for `DATABASE_URL`.
   - **Direct connection** string for `DIRECT_URL`.
5. Replace `[YOUR-PASSWORD]` and the project reference placeholders. URL-encode special password characters. For example, `@` becomes `%40`.

Keep `?pgbouncer=true` on the pooled `DATABASE_URL` when using Supabase's transaction pooler.

## 2. Configure local environment

Copy `.env.example` to `.env` and add the two Supabase URLs:

```bash
cp .env.example .env
```

Do not commit `.env`. It is already ignored by `.gitignore`.

## 3. Create the Supabase tables

This project has no safe committed Prisma migration history for the existing MySQL database. After checking the schema, create the initial PostgreSQL schema with:

```bash
npx prisma db push
npx prisma generate
```

For a production migration workflow, use a migration file instead:

```bash
npx prisma migrate dev --name init_supabase
```

Review the generated SQL before applying it to production. Do not run `migrate dev` against production.

## 4. Move the existing MySQL data

`prisma db push` creates tables but does not copy MySQL rows. Export the MySQL data, then import it into Supabase using one of these approaches:

- Use Supabase's import tools for a CSV export of each table.
- Use a migration utility such as pgloader after reviewing the converted SQL.
- Write a one-time script that reads the MySQL tables and creates the equivalent Prisma records in Supabase.

The existing `next_db.sql` is MySQL SQL and should not be pasted directly into Supabase's SQL editor without conversion. Preserve the existing user IDs and emails if current accounts must keep working. Verify `user.role`, `user.status`, and password values after import.

## 5. Test locally

Start the app after MariaDB is no longer needed:

```bash
npm run dev
```

Test login and the user-management pages. If Prisma reports a connection error, check the URLs, password encoding, and whether the Supabase project is paused.

## 6. Configure Vercel

1. Import the repository into Vercel.
2. Open **Project Settings > Environment Variables**.
3. Add these variables for **Production**, **Preview**, and **Development** as needed:
   - `DATABASE_URL`: Supabase Session Pooler URL.
   - `DIRECT_URL`: Supabase direct connection URL.
4. Redeploy after saving the variables.

The build script runs `prisma generate` automatically. Vercel must use the same `npm run build` command from `package.json`.

## Connection roles

- `DATABASE_URL` is used by the Next.js runtime through `PrismaPg`.
- `DIRECT_URL` is used by `prisma.config.ts` for schema operations.
- Never expose either URL in client-side code or commit them to Git.
