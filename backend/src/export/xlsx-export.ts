import { Workbook, Worksheet } from 'exceljs';
import { BoutiqueExportData, EvaluationExportData, LignePersonneExport, formaterScore } from './export-data';
import { chargerLogoPng } from './logo';
import { protegerFormule } from './proteger-formule';

const COULEURS = {
  brandPrimary: 'FF2F5D50',
  brandTint: 'FFE4EEE8',
  success: 'FF4F8B6B',
  warning: 'FFC0862E',
  danger: 'FFB3492F',
  textMuted: 'FF5B6B62',
  border: 'FFDDE5E0',
  white: 'FFFFFFFF',
};

function couleurDecision(categorie: EvaluationExportData['categorieDecision']): string {
  if (categorie === 'success') return COULEURS.success;
  if (categorie === 'warning') return COULEURS.warning;
  if (categorie === 'danger') return COULEURS.danger;
  return COULEURS.textMuted;
}

/** Logo mark in the A1 gutter column + brand/title rows, shared by every sheet. Column A is a
 * narrow gutter reserved for the logo so it never overlaps the title text next to it. */
function ecrireEnTeteMarque(workbook: Workbook, sheet: Worksheet, imageId: number, titre: string, derniereColonne: string) {
  sheet.addImage(imageId, { tl: { col: 0.05, row: 0.05 }, ext: { width: 24, height: 24 } });
  sheet.getRow(1).height = 20;

  const brandCell = sheet.getCell(`B1`);
  brandCell.value = {
    richText: [
      { font: { bold: true, size: 11, color: { argb: COULEURS.brandPrimary } }, text: 'Patchi  ' },
      { font: { size: 9, color: { argb: COULEURS.textMuted } }, text: 'Performly' },
    ],
  };
  sheet.mergeCells(`B1:${derniereColonne}1`);

  sheet.getRow(2).height = 24;
  const titreCell = sheet.getCell('B2');
  titreCell.value = titre;
  titreCell.font = { bold: true, size: 15, color: { argb: '000000' } };
  sheet.mergeCells(`B2:${derniereColonne}2`);

  sheet.addRow([]);
}

function ecrireInfos(sheet: Worksheet, infos: [string, string][], derniereColonne: string) {
  for (const [label, valeur] of infos) {
    const row = sheet.addRow(['', protegerFormule(label), protegerFormule(valeur)]);
    row.getCell(2).font = { bold: true, color: { argb: COULEURS.textMuted } };
    sheet.mergeCells(`C${row.number}:${derniereColonne}${row.number}`);
  }
}

/** Writes one evaluation's category/critÃ¨re breakdown + decision banner into a sheet. Assumes
 * the header (logo/title) and info rows have already been written. Columns: A gutter, B critÃ¨re,
 * C score, D commentaire. */
function ecrireCorpsEvaluation(sheet: Worksheet, data: EvaluationExportData) {
  sheet.addRow([]);
  for (const categorie of data.categories) {
    const catRow = sheet.addRow(['', protegerFormule(categorie.nom).toUpperCase()]);
    sheet.mergeCells(`B${catRow.number}:D${catRow.number}`);
    catRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COULEURS.brandTint } };
      cell.font = { bold: true, color: { argb: COULEURS.brandPrimary } };
    });
    catRow.height = 20;

    const headerRow = sheet.addRow(['', 'CritÃ¨re', 'Score', 'Commentaire']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, color: { argb: COULEURS.textMuted } };
      cell.border = { bottom: { style: 'thin', color: { argb: COULEURS.border } } };
    });

    for (const critere of categorie.criteres) {
      const row = sheet.addRow(['', protegerFormule(critere.libelle), critere.score ?? 'â€”', protegerFormule(critere.commentaire ?? '')]);
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(4).alignment = { wrapText: true };
      row.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: COULEURS.border } } };
      });
    }
    sheet.addRow([]);
  }

  const scoreLabel = data.scoreMax ? `${formaterScore(data.scoreTotal)} / ${data.scoreMax}` : formaterScore(data.scoreTotal);
  const scoreRow = sheet.addRow(['', 'Score total', scoreLabel]);
  scoreRow.getCell(2).font = { bold: true };
  sheet.mergeCells(`C${scoreRow.number}:D${scoreRow.number}`);

  const decisionRow = sheet.addRow(['', 'DÃ©cision RH', protegerFormule(data.decisionRh)]);
  sheet.mergeCells(`C${decisionRow.number}:D${decisionRow.number}`);
  decisionRow.getCell(2).font = { bold: true };
  const decisionCell = decisionRow.getCell(3);
  decisionCell.font = { bold: true, color: { argb: COULEURS.white } };
  decisionCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: couleurDecision(data.categorieDecision) } };
  decisionCell.alignment = { vertical: 'middle' };
}

function nomFeuilleUnique(nom: string, existants: Set<string>): string {
  const base = nom.replace(/[:\\/?*[\]]/g, ' ').slice(0, 28).trim() || 'Personne';
  let candidat = base;
  let i = 2;
  while (existants.has(candidat.toLowerCase())) {
    candidat = `${base} (${i})`.slice(0, 31);
    i += 1;
  }
  existants.add(candidat.toLowerCase());
  return candidat;
}

export async function genererEvaluationXlsx(data: EvaluationExportData): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = 'Patchi - Performly';
  workbook.created = new Date();
  // exceljs's own .d.ts redeclares the global `Buffer` as `extends ArrayBuffer`, clashing with
  // @types/node's real (generic) Buffer - so Image options are typed here as `any` to sidestep
  // that third-party typing bug rather than fight it with casts.
  const imageId = workbook.addImage({ buffer: chargerLogoPng(), extension: 'png' } as any);

  const sheet = workbook.addWorksheet('Ã‰valuation', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
  });
  sheet.columns = [{ width: 4 }, { width: 40 }, { width: 12 }, { width: 53 }];

  ecrireEnTeteMarque(workbook, sheet, imageId, `Ã‰valuation ${data.posteLabel}`, 'D');
  ecrireInfos(
    sheet,
    [
      ['Boutique', data.boutiqueNom],
      ['Personne', data.personneNom],
      ['PÃ©riode', data.periode],
      ['Statut', data.statutLabel],
      ['Ã‰valuateur', data.evaluateurEmail],
      ['Date de soumission', data.dateSoumission ? data.dateSoumission.toLocaleDateString('fr-FR') : 'Non soumise'],
    ],
    'D',
  );
  ecrireCorpsEvaluation(sheet, data);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function genererBoutiqueExportXlsx(data: BoutiqueExportData): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = 'Patchi - Performly';
  workbook.created = new Date();
  // exceljs's own .d.ts redeclares the global `Buffer` as `extends ArrayBuffer`, clashing with
  // @types/node's real (generic) Buffer - so Image options are typed here as `any` to sidestep
  // that third-party typing bug rather than fight it with casts.
  const imageId = workbook.addImage({ buffer: chargerLogoPng(), extension: 'png' } as any);

  const resume = workbook.addWorksheet('RÃ©sumÃ©', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });
  resume.columns = [{ width: 4 }, { width: 32 }, { width: 20 }, { width: 14 }, { width: 40 }];

  ecrireEnTeteMarque(workbook, resume, imageId, `Ã‰valuations â€” ${data.boutiqueNom}`, 'E');
  ecrireInfos(
    resume,
    [
      ['Boutique', data.boutiqueNom],
      ['PÃ©riode', data.periode],
      ['GÃ©nÃ©rÃ© le', data.genereLe.toLocaleDateString('fr-FR')],
    ],
    'E',
  );
  resume.addRow([]);

  const headerRow = resume.addRow(['', 'Personne', 'Poste', 'Score', 'DÃ©cision RH']);
  headerRow.eachCell((cell, col) => {
    if (col === 1) return;
    cell.font = { bold: true, size: 10, color: { argb: COULEURS.textMuted } };
    cell.border = { bottom: { style: 'thin', color: { argb: COULEURS.border } } };
  });

  const nomsFeuilles = new Set<string>(['rÃ©sumÃ©']);
  const feuillesParLigne: { ligne: LignePersonneExport; feuille: string }[] = [];

  for (const ligne of data.lignes) {
    const scoreLabel = ligne.scoreMax ? `${formaterScore(ligne.scoreTotal)} / ${ligne.scoreMax}` : formaterScore(ligne.scoreTotal);
    const row = resume.addRow([
      '',
      protegerFormule(ligne.personneNom),
      protegerFormule(ligne.posteLabel),
      scoreLabel,
      protegerFormule(ligne.decisionRh),
    ]);
    row.getCell(5).font = { color: { argb: couleurDecision(ligne.categorieDecision) }, bold: true };
    row.eachCell((cell, col) => {
      if (col === 1) return;
      cell.border = { bottom: { style: 'hair', color: { argb: COULEURS.border } } };
    });
    if (ligne.detail) {
      feuillesParLigne.push({ ligne, feuille: nomFeuilleUnique(ligne.personneNom, nomsFeuilles) });
    }
  }

  for (const { ligne, feuille } of feuillesParLigne) {
    const sheet = workbook.addWorksheet(feuille, {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
    });
    sheet.columns = [{ width: 4 }, { width: 40 }, { width: 12 }, { width: 53 }];
    ecrireEnTeteMarque(
      workbook,
      sheet,
      imageId,
      `${protegerFormule(ligne.personneNom)} â€” ${protegerFormule(ligne.posteLabel)}`,
      'D',
    );
    ecrireInfos(
      sheet,
      [
        ['Boutique', data.boutiqueNom],
        ['Personne', ligne.detail!.personneNom],
        ['PÃ©riode', ligne.detail!.periode],
        ['Statut', ligne.detail!.statutLabel],
        ['Ã‰valuateur', ligne.detail!.evaluateurEmail],
        [
          'Date de soumission',
          ligne.detail!.dateSoumission ? ligne.detail!.dateSoumission.toLocaleDateString('fr-FR') : 'Non soumise',
        ],
      ],
      'D',
    );
    ecrireCorpsEvaluation(sheet, ligne.detail!);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
