import type { MonsterTraits } from "@/lib/types";

export function TraitList({ monster }: { monster: MonsterTraits }) {
  const rows = [
    ["Size", monster.size], ["Alignment", monster.alignment], ["Actions", monster.actions.join(", ")],
    ["Special ability", monster.specialAbility], ["Weakness", monster.weakness], ["Locomotion", monster.locomotion],
    ["Languages", monster.languages.join(", ")],
  ];
  return <dl className="trait-list">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
