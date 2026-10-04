/**
 * Domain errors. Messages are written for players: clear first, themed second
 * (CLAUDE.md §29).
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
    super(`You need ${required} GP to redeem this reward. You have ${balance} GP.`, "INSUFFICIENT_GP");
  }
}

export class CharacterNotFoundError extends GameRuleError {
  constructor(readonly characterId?: string) {
    super(
      characterId
        ? `No character exists with id ${characterId}.`
        : "No character exists yet. Run `npm run db:setup` to create your character.",
      "CHARACTER_NOT_FOUND",
    );
  }
}
