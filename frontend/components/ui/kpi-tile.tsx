import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiTileProps {
  title: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
  href?: string;
  active?: boolean;
}

const TONE_TEXT: Record<NonNullable<KpiTileProps['tone']>, string> = {
  default: 'text-text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const TONE_ICON_BG: Record<NonNullable<KpiTileProps['tone']>, string> = {
  default: 'bg-brand-tint text-brand-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};

const TONE_RING: Record<NonNullable<KpiTileProps['tone']>, string> = {
  default: 'ring-brand-primary',
  success: 'ring-success',
  warning: 'ring-warning',
  danger: 'ring-danger',
};

export function KpiTile({ title, value, tone = 'default', icon: Icon, href, active }: KpiTileProps) {
  const card = (
    <Card
      className={cn(
        href && 'cursor-pointer transition-shadow hover:border-brand-primary',
        active && cn('ring-2', TONE_RING[tone]),
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle>{title}</CardTitle>
        {Icon && (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', TONE_ICON_BG[tone])}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </CardHeader>
      <CardContent className={cn('text-h1', TONE_TEXT[tone])}>{value}</CardContent>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block" scroll={false}>
      {card}
    </Link>
  );
}
