/**
 * Domain errors. Messages are written for players: clear first, themed second
 * (CLAUDE.md §33).
 */

export class GameRuleError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InsufficientGpError extends GameRuleError {
  constructor(
    readonly balance: number,
    readonly required: number,
  ) {
    super(
      `Not enough GP: ${required} GP required, ${balance} GP available. Your balance was not changed.`,
      "INSUFFICIENT_GP",
    );
  }
}

export class InvalidProgressionError extends GameRuleError {
  constructor(message: string) {
    super(message, "INVALID_PROGRESSION");
  }
}

export class CharacterNotFoundError extends GameRuleError {
  constructor(readonly characterId?: string) {
    super(
      characterId
        ? `No character exists with id ${characterId}.`
        : "No character exists yet. Run `npm run db:seed` to create your character.",
      "CHARACTER_NOT_FOUND",
    );
  }
}
