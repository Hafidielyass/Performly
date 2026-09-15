import { Workbook } from 'exceljs';
import { Poste, TypeContrat } from '@prisma/client';

// Combining diacritical marks (U+0300-U+036F), built from char codes to keep this file plain ASCII.
const DIACRITIQUES = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, 'g');

function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(DIACRITIQUES, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const ALIAS_POSTE: Record<string, Poste> = {
  gerant: Poste.GERANT,
  gerante: Poste.GERANT,
  manager: Poste.GERANT,
  adjoint: Poste.ADJOINT,
  adjointe: Poste.ADJOINT,
  assistantmanager: Poste.ADJOINT,
  vendeur: Poste.VENDEUR,
  vendeuse: Poste.VENDEUR,
  vendeurse: Poste.VENDEUR,
  sales: Poste.VENDEUR,
  femmedemenage: Poste.FEMME_MENAGE,
  menage: Poste.FEMME_MENAGE,
  housekeeping: Poste.FEMME_MENAGE,
  voiturier: Poste.VOITURIER,
  chauffeur: Poste.CHAUFFEUR,
  driver: Poste.CHAUFFEUR,
};

// Also accept the raw enum keys (GERANT, VENDEUR, ...) so a re-export of our own data round-trips.
for (const valeur of Object.values(Poste)) {
  ALIAS_POSTE[normaliser(valeur)] = valeur;
}

export function resoudrePoste(texteBrut: string): Poste | null {
  return ALIAS_POSTE[normaliser(texteBrut)] ?? null;
}

const ALIAS_TYPE_CONTRAT: Record<string, TypeContrat> = {
  cdi: TypeContrat.CDI,
  cdd: TypeContrat.CDD,
  prestation: TypeContrat.PRESTATION,
  presta: TypeContrat.PRESTATION,
  freelance: TypeContrat.PRESTATION,
};

export function resoudreTypeContrat(texteBrut: string): TypeContrat | null {
  return ALIAS_TYPE_CONTRAT[normaliser(texteBrut)] ?? null;
}

// Header aliases - matched case/accent-insensitively with spaces and punctuation stripped, so the
// exact HR template headers ("Nom Prénom", "Fonction / Grade", ...) and looser variants both work.
const ALIAS_COLONNE_NOM = ['nom', 'nomprenom', 'nomcomplet', 'name', 'fullname'];
const ALIAS_COLONNE_POSTE = ['poste', 'fonctiongrade', 'fonction', 'role', 'rle', 'grade', 'position'];
const ALIAS_COLONNE_TYPE_CONTRAT = ['typecontrat', 'contrat', 'type'];
const ALIAS_COLONNE_ANCIENNETE = ['ancienneteans', 'anciennete', 'ancienneteannees'];
const ALIAS_COLONNE_SALAIRE = ['salairenetactueldh', 'salairenetactuel', 'salairenet', 'salaire'];

export interface LigneImportBrute {
  ligne: number;
  nomComplet: string | null;
  posteRaw: string | null;
  typeContratRaw: string | null;
  ancienneteRaw: string | null;
  salaireRaw: string | null;
}

export interface ResultatParsing {
  lignes: LigneImportBrute[];
  erreurStructure: string | null;
}

function valeurCellule(row: import('exceljs').Row, colonne: number): string | null {
  if (colonne === -1) return null;
  return String(row.getCell(colonne).value ?? '').trim() || null;
}

/** Parses an uploaded .xlsx into raw rows matching the HR roster template: Nom Prénom,
 * Fonction / Grade, Type contrat, Ancienneté (ans), Salaire Net actuel (DH). Column order doesn't
 * matter - headers are matched by name, case/accent-insensitive. Only the name and role columns
 * are required; contrat/ancienneté/salaire fall back to sensible defaults when absent. */
export async function parserFeuillePersonnes(buffer: Buffer): Promise<ResultatParsing> {
  const workbook = new Workbook();
  try {
    // exceljs's own .d.ts redeclares the global `Buffer` incompatibly with @types/node - see the
    // same workaround/comment in xlsx-export.ts.
    await workbook.xlsx.load(buffer as any);
  } catch {
    return { lignes: [], erreurStructure: "Le fichier n'est pas un classeur Excel (.xlsx) valide." };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { lignes: [], erreurStructure: 'Le classeur ne contient aucune feuille.' };
  }

  const headerRow = sheet.getRow(1);
  let colonneNom = -1;
  let colonnePoste = -1;
  let colonneTypeContrat = -1;
  let colonneAnciennete = -1;
  let colonneSalaire = -1;
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const valeur = normaliser(String(cell.value ?? ''));
    if (ALIAS_COLONNE_NOM.includes(valeur)) colonneNom = colNumber;
    if (ALIAS_COLONNE_POSTE.includes(valeur)) colonnePoste = colNumber;
    if (ALIAS_COLONNE_TYPE_CONTRAT.includes(valeur)) colonneTypeContrat = colNumber;
    if (ALIAS_COLONNE_ANCIENNETE.includes(valeur)) colonneAnciennete = colNumber;
    if (ALIAS_COLONNE_SALAIRE.includes(valeur)) colonneSalaire = colNumber;
  });

  if (colonneNom === -1 || colonnePoste === -1) {
    return {
      lignes: [],
      erreurStructure:
        'Colonnes introuvables. La première ligne doit contenir au moins une colonne "Nom Prénom" et une colonne "Fonction / Grade".',
    };
  }

  const lignes: LigneImportBrute[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const nomComplet = valeurCellule(row, colonneNom);
    const posteRaw = valeurCellule(row, colonnePoste);
    const typeContratRaw = valeurCellule(row, colonneTypeContrat);
    const ancienneteRaw = valeurCellule(row, colonneAnciennete);
    const salaireRaw = valeurCellule(row, colonneSalaire);
    if (!nomComplet && !posteRaw) return;
    lignes.push({ ligne: rowNumber, nomComplet, posteRaw, typeContratRaw, ancienneteRaw, salaireRaw });
  });

  return { lignes, erreurStructure: null };
}

export async function genererModeleImportXlsx(): Promise<Buffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Personnes');
  sheet.columns = [
    { header: 'Nom Prénom', width: 28 },
    { header: 'Fonction / Grade', width: 20 },
    { header: 'Type contrat', width: 14 },
    { header: 'Ancienneté (ans)', width: 16 },
    { header: 'Salaire Net actuel (DH)', width: 22 },
  ];
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5D50' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  headerRow.height = 30;
  sheet.addRow(['Salma El Amrani', 'Gérant(e)', 'CDI', 3, 7500]);
  sheet.addRow(['Youssef Bennani', 'Vendeur(se)', 'CDI', 1, 3200]);

  const notes = workbook.addWorksheet('Valeurs acceptées');
  notes.columns = [
    { header: 'Fonction / Grade', width: 30 },
    { header: 'Type contrat', width: 20 },
  ];
  notes.getRow(1).font = { bold: true };
  const postes = ['Gérant(e)', 'Adjoint(e)', 'Vendeur(se)', 'Femme de Ménage', 'Voiturier', 'Chauffeur'];
  const contrats = ['CDI', 'CDD', 'Prestation'];
  const maxLignes = Math.max(postes.length, contrats.length);
  for (let i = 0; i < maxLignes; i++) {
    notes.addRow([postes[i] ?? '', contrats[i] ?? '']);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
