"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { updateProfileAction, updateSettingsAction } from "@/app/(realm)/settings/actions";
import { WorldVista } from "@/components/art/WorldVista";
import { AvatarSprite } from "@/components/character/AvatarSprite";
import { PixelIcon } from "@/components/icons/PixelIcon";
import type { SpriteName } from "@/components/icons/sprites";
import { GameButton } from "@/components/ui/GameButton";
import { GamePanel } from "@/components/ui/GamePanel";
import { Notice } from "@/components/ui/Notice";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AVATAR_HAIR_COLORS, AVATAR_HAIR_STYLES, AVATAR_SKIN_TONES, AVATAR_TUNIC_COLORS, type AvatarConfig } from "@/game/avatar";
import { GP_QUICK_CHOICES } from "@/game/quests";
import { BACKGROUNDS, type CharacterSettings } from "@/game/settings";
import { cx } from "@/lib/cx";

const field =
  "w-full rounded-sm border border-stone-600 bg-stone-950 px-3 py-2 text-text-primary placeholder:text-text-disabled focus:border-gold-400 focus:outline-none focus-visible:outline-2 focus-visible:outline-focus-ring";

const BACKGROUND_LABELS: Record<(typeof BACKGROUNDS)[number], string> = { default: "Default", forest: "Forest", mountain: "Mountain" };

function Section({ id, title, icon, children }: { id: string; title: string; icon: SpriteName; children: ReactNode }) {
  return (
    <GamePanel as="section" labelledBy={id} className="p-5">
      <SectionHeader id={id} title={title} icon={<PixelIcon name={icon} size={24} />} divider />
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </GamePanel>
  );
}

/** An on/off switch: a real button with role="switch", labeled, with text state (not color alone). */
function Toggle({ label, hint, checked, disabled, onChange }: { label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-text-primary">{label}</span>
        {hint && <span className="text-sm text-text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-60",
          checked ? "border-moss-500 bg-moss-600" : "border-stone-500 bg-stone-800",
        )}
      >
        <span aria-hidden className={cx("absolute size-5 rounded-full bg-parchment-50 shadow transition-transform", checked ? "translate-x-7" : "translate-x-0.5")} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export function SettingsBoard({
  displayName,
  avatar,
  settings,
  signedInEmail,
}: {
  displayName: string;
  avatar: AvatarConfig;
  settings: CharacterSettings;
  signedInEmail: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [gp, setGp] = useState(String(settings.defaultQuestGp));

  const save = (patch: Partial<CharacterSettings>) => {
    setError(null);
    startTransition(async () => {
      const r = await updateSettingsAction(patch);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      {error && <Notice tone="error" className="xl:col-span-2">{error}</Notice>}
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileSection displayName={displayName} avatar={avatar} />
        <Section id="settings-appearance" title="Appearance" icon="world">
          <fieldset>
            <legend className="text-sm text-text-secondary">Background</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={settings.background === b}
                  disabled={pending}
                  onClick={() => save({ background: b })}
                  className={cx("flex flex-col gap-1.5 rounded-sm border-2 p-1 text-sm", settings.background === b ? "border-gold-400 text-gold-100" : "border-stone-700 text-text-secondary hover:border-stone-500")}
                >
                  <span data-background={b} className="block">
                    <span className="q-vista block h-16 overflow-hidden rounded-xs">
                      <WorldVista />
                    </span>
                  </span>
                  <span>
                    {settings.background === b && <span aria-hidden>✓ </span>}
                    {BACKGROUND_LABELS[b]}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <Toggle
            label="Reduce motion"
            hint="Always calm animations, even if your device allows them."
            checked={settings.motion === "reduce"}
            disabled={pending}
            onChange={(v) => save({ motion: v ? "reduce" : "system" })}
          />
          <Toggle label="Sound" hint="A short chime when you complete a quest or redeem a reward." checked={settings.sound} disabled={pending} onChange={(v) => save({ sound: v })} />
        </Section>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <Section id="settings-feedback" title="Celebrations" icon="star">
          <Toggle
            label="Quest completion"
            hint="Show the Quest Complete reveal. Off: a quick confirmation instead."
            checked={settings.celebrateCompletions}
            disabled={pending}
            onChange={(v) => save({ celebrateCompletions: v })}
          />
          <Toggle
            label="Reward redemptions"
            hint="Show the Reward Redeemed reveal. Off: a quick confirmation instead."
            checked={settings.celebrateRedemptions}
            disabled={pending}
            onChange={(v) => save({ celebrateRedemptions: v })}
          />
        </Section>

        <Section id="settings-game" title="Game Settings" icon="gp">
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              save({ defaultQuestGp: Number(gp) });
            }}
          >
            <label htmlFor="default-gp" className="text-text-primary">
              Default quest reward
              <span className="block text-sm text-text-muted">Suggested GP when you add a quest.</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2">
                <PixelIcon name="gp" size={22} />
                <input id="default-gp" className={cx(field, "w-24 tabular-nums")} type="number" min={0} step={1} value={gp} onChange={(e) => setGp(e.target.value)} />
              </span>
              {GP_QUICK_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={Number(gp) === n}
                  onClick={() => setGp(String(n))}
                  className={cx("min-h-9 min-w-11 rounded-sm border px-2 tabular-nums", Number(gp) === n ? "border-gold-500 text-gold-100" : "border-stone-700 text-text-secondary hover:border-stone-500")}
                >
                  {n}
                </button>
              ))}
              <GameButton type="submit" size="sm" disabled={pending || Number(gp) === settings.defaultQuestGp}>
                Save
              </GameButton>
            </div>
          </form>
          <Toggle
            label="Confirm before completing"
            hint="Ask “Complete this quest?” before awarding GP."
            checked={settings.confirmCompletion}
            disabled={pending}
            onChange={(v) => save({ confirmCompletion: v })}
          />
          <Toggle label="Show savings goal" hint="On the Quest Log." checked={settings.showSavingsGoal} disabled={pending} onChange={(v) => save({ showSavingsGoal: v })} />
          <Toggle label="Show recent completions" hint="On the Quest Log." checked={settings.showRecentCompletions} disabled={pending} onChange={(v) => save({ showRecentCompletions: v })} />
        </Section>

        <Section id="settings-data" title="Data" icon="diaries">
          <p className="text-text-secondary">Download everything — quests, completed history, GP ledger, rewards, and redemptions — as a JSON file.</p>
          <a
            href="/export"
            download
            className="q-title inline-flex min-h-11 items-center gap-2 self-start rounded-sm border border-blue-600 bg-stone-850 px-5 text-text-primary hover:border-blue-400 hover:bg-stone-800"
          >
            <PixelIcon name="diaries" size={18} /> Export My Data
          </a>
          {signedInEmail && (
            <form action="/auth/signout" method="post" className="flex flex-wrap items-center gap-3 border-t border-stone-700 pt-4">
              <span className="text-sm text-text-secondary">
                Signed in as <span className="text-text-primary">{signedInEmail}</span>
              </span>
              <GameButton type="submit" size="sm" variant="ghost">
                Sign Out
              </GameButton>
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}

function ProfileSection({ displayName, avatar }: { displayName: string; avatar: AvatarConfig }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(displayName);
  const [look, setLook] = useState(avatar);
  const [editingLook, setEditingLook] = useState(false);
  const dirty = name.trim() !== displayName || JSON.stringify(look) !== JSON.stringify(avatar);

  const cycle = <T extends string>(list: readonly T[], value: T) => list[(list.indexOf(value) + 1) % list.length];

  return (
    <Section id="settings-profile" title="Profile" icon="character">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          setSaved(false);
          startTransition(async () => {
            const r = await updateProfileAction({ displayName: name, avatar: look });
            if (!r.ok) return setError(r.error);
            setSaved(true);
            setEditingLook(false);
            router.refresh();
          });
        }}
      >
        <div className="flex items-center gap-4">
          <span className="q-well flex h-24 w-20 shrink-0 items-end justify-center overflow-hidden border border-border-dark">
            <AvatarSprite avatar={look} name={name || displayName} height={88} />
          </span>
          <div className="min-w-0 flex-1">
            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Display name
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
            </label>
            <button type="button" className="mt-2 text-sm text-blue-300 underline-offset-4 hover:underline" aria-expanded={editingLook} onClick={() => setEditingLook((v) => !v)}>
              {editingLook ? "Done changing avatar" : "Change avatar"}
            </button>
          </div>
        </div>
        {editingLook && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ["Skin", () => setLook({ ...look, skinTone: cycle(AVATAR_SKIN_TONES, look.skinTone) }), look.skinTone],
                ["Hair", () => setLook({ ...look, hairStyle: cycle(AVATAR_HAIR_STYLES, look.hairStyle) }), look.hairStyle],
                ["Hair color", () => setLook({ ...look, hairColor: cycle(AVATAR_HAIR_COLORS, look.hairColor) }), look.hairColor],
                ["Tunic", () => setLook({ ...look, tunicColor: cycle(AVATAR_TUNIC_COLORS, look.tunicColor) }), look.tunicColor],
                ["Beard", () => setLook({ ...look, beard: !look.beard }), look.beard ? "yes" : "no"],
              ] as const
            ).map(([label, onClick, value]) => (
              <button key={label} type="button" onClick={onClick} className="flex min-h-11 flex-col items-start rounded-sm border border-stone-700 px-3 py-1 text-left hover:border-stone-500">
                <span className="text-xs text-text-muted">{label}</span>
                <span className="capitalize text-text-primary">{value} ›</span>
              </button>
            ))}
          </div>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex items-center gap-3">
          <GameButton type="submit" disabled={pending || !dirty}>
            Save Profile
          </GameButton>
          {saved && !dirty && (
            <span role="status" className="text-sm text-moss-300">
              ✓ Saved
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}
