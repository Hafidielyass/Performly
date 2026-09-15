import { cn } from '@/lib/utils';

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="var(--brand-primary)" />
      <path
        d="M14 28V13.5C14 12.6716 14.6716 12 15.5 12H20.5C23.5376 12 26 14.4624 26 17.5C26 20.5376 23.5376 23 20.5 23H16.5"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export function Logo({ variant = 'full', className }: LogoProps) {
  if (variant === 'icon') {
    return <LogoMark className={cn('h-8 w-8', className)} />;
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-8 w-8 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className="text-h3 text-brand-primary">Patchi</span>
        <span className="text-small text-text-muted">Performly</span>
      </div>
    </div>
  );
}
