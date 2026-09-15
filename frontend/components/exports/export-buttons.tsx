'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { downloadFile } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface ExportButtonsProps {
  xlsxPath: string;
  pdfPath: string;
  fallbackName: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButtons({ xlsxPath, pdfPath, fallbackName, disabled, className }: ExportButtonsProps) {
  const [exportEnCours, setExportEnCours] = useState<'xlsx' | 'pdf' | null>(null);

  async function handleExport(format: 'xlsx' | 'pdf') {
    setExportEnCours(format);
    try {
      await downloadFile(format === 'xlsx' ? xlsxPath : pdfPath, `${fallbackName}.${format}`);
    } finally {
      setExportEnCours(null);
    }
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled || exportEnCours !== null}
        onClick={() => handleExport('xlsx')}
      >
        <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={2} />
        {exportEnCours === 'xlsx' ? 'Export...' : 'Excel'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled || exportEnCours !== null}
        onClick={() => handleExport('pdf')}
      >
        <FileText className="h-3.5 w-3.5" strokeWidth={2} />
        {exportEnCours === 'pdf' ? 'Export...' : 'PDF'}
      </Button>
    </div>
  );
}
