Run a database migration:

1. Review the current schema at `prisma/schema.prisma`
2. Make the requested schema changes following conventions:
   - Use `@default(cuid())` for new model IDs
   - Add `@@index` for frequently queried fields
   - Use `@db.Text` for long text fields
   - Set up cascade deletes for parent-child relationships
3. Run `npx prisma migrate dev --name $ARGUMENTS` to create the migration
4. Run `npx prisma generate` to regenerate the Prisma client
5. Check if `seed.ts` needs updating for the new schema
6. Verify the migration was applied successfully with `npx prisma studio`

Migration name: $ARGUMENTS
