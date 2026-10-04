import { getDb } from "@/server/db/client";
import { exportCharacter } from "@/server/export/service";
import { NotSignedInError, resolveCurrentCharacterId } from "@/server/auth/session";

/** Download the whole account as JSON (Settings → Export). */
export async function GET() {
  const db = await getDb();
  let characterId: string;
  try {
    characterId = await resolveCurrentCharacterId(db);
  } catch (error) {
    if (error instanceof NotSignedInError) return new Response("Sign in to export your adventure.", { status: 401 });
    throw error;
  }
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
