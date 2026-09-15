import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formaterPeriode } from '@/lib/periode';

interface PeriodeSelectProps {
  periodes: string[] | undefined;
  value: string | undefined;
  onChange: (periode: string) => void;
}

export function PeriodeSelect({ periodes, value, onChange }: PeriodeSelectProps) {
  if (!periodes || periodes.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-text-muted" strokeWidth={2} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Choisir un mois" />
        </SelectTrigger>
        <SelectContent>
          {periodes.map((periode) => (
            <SelectItem key={periode} value={periode}>
              {formaterPeriode(periode)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
