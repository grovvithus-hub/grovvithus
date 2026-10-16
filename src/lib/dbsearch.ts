/**
 * Search filter that ignores upper/lower case on every database.
 * SQLite and MySQL already compare case-insensitively; PostgreSQL (Render) needs `mode: "insensitive"`.
 * The return type is kept simple because only the PostgreSQL client knows the `mode` option.
 */
const isPostgres = () => /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL || "");

export const like = (value: string): { contains: string } =>
  (isPostgres() ? { contains: value, mode: "insensitive" } : { contains: value }) as { contains: string };
