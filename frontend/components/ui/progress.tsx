import { cn } from '@/lib/utils';

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-brand-tint', className)}>
      <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}
