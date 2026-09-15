import { Poste } from '@/lib/types';
import { POSTE_ICONS, POSTE_LABELS } from '@/lib/poste-labels';

export function PosteTag({ poste }: { poste: Poste }) {
  const Icon = POSTE_ICONS[poste];
  return (
    <span className="inline-flex items-center gap-1.5 text-body text-text-primary">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-tint text-brand-primary">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      {POSTE_LABELS[poste]}
    </span>
  );
}
