import fs from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");
const sql = postgres(url, { max: 1 });

async function main() {
  try {
    const migration = await fs.readFile(new URL("../drizzle/0000_monster_app.sql", import.meta.url), "utf8");
    await sql.unsafe(migration);
    console.info("monster_app migration complete");
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
