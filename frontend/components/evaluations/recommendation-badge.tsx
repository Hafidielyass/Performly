import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategorieDecision } from '@/lib/types';

const ICONS: Record<CategorieDecision, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  neutral: Clock,
};

export function RecommendationBadge({ decisionRh, categorie }: { decisionRh: string; categorie: CategorieDecision }) {
  const Icon = ICONS[categorie];
  return (
    <Badge variant={categorie} className="gap-1">
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      {decisionRh}
    </Badge>
  );
}
