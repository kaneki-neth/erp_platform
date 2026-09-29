# AI Development Guidelines

When modifying this repository:

1. **Read Existing Documentation**: Always consult `docs/architecture/` before proposing architectural modifications.
2. **Make Small, Focused Changes**: Do not refactor unrelated code or alter established conventions.
3. **Add Tests**: Whenever adding new business models or tenant-scoped endpoints, create automated tests verifying tenant isolation and authorization.
4. **No Destructive Operations**: Never run destructive database commands or drop tables without explicit permission.
5. **Preserve Clean Monorepo Structure**: Keep `apps/api` and `apps/admin` completely decoupled.
