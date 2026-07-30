<!-- Use this file to provide workspace-specific custom instructions to Copilot. -->

- [x] Next.js project has been successfully initialized with TypeScript
- [x] Framework: Next.js with App Router
- [x] Language: TypeScript
- [x] Styling: Tailwind CSS
- [x] Linting: ESLint
- [x] Dependencies installed via npm

## Project Structure
- `src/` - Source directory containing application code
- `src/app/` - App Router routes and layouts
- `public/` - Static files
- `package.json` - Project dependencies and scripts

## Database Setup (MySQL + Prisma)
- **ORM**: Prisma
- **Database**: MySQL
- **Configuration**: Update `DATABASE_URL` in `.env` with your MySQL credentials
  - Default format: `mysql://root:@localhost:3306/next_db`
  - Replace `root`, password, and database name as needed

## Prisma Commands
- `npx prisma migrate dev --name <migration-name>` - Create and run migrations
- `npx prisma db push` - Push schema changes to database
- `npx prisma db pull` - Introspect and update schema from existing database
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma generate` - Generate Prisma Client

## Available Commands
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Getting Started
1. Update the `DATABASE_URL` in `.env` with your MySQL connection string
2. Define your data models in `prisma/schema.prisma`
3. Run `npx prisma migrate dev --name init` to create the initial migration
4. Start development with `npm run dev`
