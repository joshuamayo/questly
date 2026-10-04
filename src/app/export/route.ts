import { getDb } from "@/server/db/client";
import { exportCharacter } from "@/server/export/service";
import { resolveCurrentCharacterId } from "@/server/queries/character-sheet";

/** Download the whole account as JSON (Settings → Export). */
export async function GET() {
  const db = await getDb();
  const characterId = await resolveCurrentCharacterId(db);
  const data = await exportCharacter(db, characterId);
  const date = data.exportedAt.slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="questly-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
