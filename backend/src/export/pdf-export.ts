import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { BoutiqueExportData, EvaluationExportData, formaterScore } from './export-data';
import { chargerLogoPng } from './logo';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LOGO_SIZE = 26;

function hex(r: number, g: number, b: number) {
  return rgb(r / 255, g / 255, b / 255);
}

const COULEURS = {
  brandPrimary: hex(47, 93, 80),
  brandTint: hex(228, 238, 232),
  bgPage: hex(246, 248, 246),
  textPrimary: hex(30, 42, 36),
  textMuted: hex(91, 107, 98),
  border: hex(221, 229, 224),
  success: hex(79, 139, 107),
  warning: hex(192, 134, 46),
  danger: hex(179, 73, 47),
  white: rgb(1, 1, 1),
};

function couleurDecision(categorie: EvaluationExportData['categorieDecision']) {
  if (categorie === 'success') return COULEURS.success;
  if (categorie === 'warning') return COULEURS.warning;
  if (categorie === 'danger') return COULEURS.danger;
  return COULEURS.textMuted;
}

/** Greedy word-wrap using actual glyph widths so French accents measure correctly. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface Ctx {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  regular: PDFFont;
  bold: PDFFont;
  logo: PDFImage;
  pageNumber: number;
}

async function creerContexte(): Promise<Ctx> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedPng(chargerLogoPng());
  const ctx: Ctx = { doc, page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN, regular, bold, logo, pageNumber: 1 };
  dessinerPiedDePage(ctx);
  return ctx;
}

function nouvellePage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
  ctx.pageNumber += 1;
  dessinerPiedDePage(ctx);
}

function assurerEspace(ctx: Ctx, hauteurNecessaire: number) {
  if (ctx.y - hauteurNecessaire < MARGIN + 20) {
    nouvellePage(ctx);
  }
}

function dessinerPiedDePage(ctx: Ctx) {
  ctx.page.drawText(`Patchi — Performly · page ${ctx.pageNumber}`, {
    x: MARGIN,
    y: MARGIN - 22,
    size: 8,
    font: ctx.regular,
    color: COULEURS.textMuted,
  });
}

function ligne(ctx: Ctx, label: string, valeur: string) {
  ctx.page.drawText(label, { x: MARGIN, y: ctx.y, size: 10, font: ctx.bold, color: COULEURS.textMuted });
  ctx.page.drawText(valeur, { x: MARGIN + 140, y: ctx.y, size: 10, font: ctx.regular, color: COULEURS.textPrimary });
  ctx.y -= 16;
}

/** Logo mark + wordmark + big page title, shared by every export so they all open the same way. */
function dessinerEnTete(ctx: Ctx, titre: string) {
  ctx.page.drawImage(ctx.logo, { x: MARGIN, y: ctx.y - LOGO_SIZE + 6, width: LOGO_SIZE, height: LOGO_SIZE });
  const texteX = MARGIN + LOGO_SIZE + 8;
  ctx.page.drawText('Patchi', { x: texteX, y: ctx.y - 6, size: 12, font: ctx.bold, color: COULEURS.brandPrimary });
  ctx.page.drawText('Performly', {
    x: texteX + ctx.bold.widthOfTextAtSize('Patchi', 12) + 8,
    y: ctx.y - 5,
    size: 9,
    font: ctx.regular,
    color: COULEURS.textMuted,
  });
  ctx.y -= 34;

  ctx.page.drawText(titre, { x: MARGIN, y: ctx.y, size: 18, font: ctx.bold, color: COULEURS.textPrimary });
  ctx.y -= 8;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
    thickness: 1.5,
    color: COULEURS.brandPrimary,
  });
  ctx.y -= 24;
}

/** Draws one evaluation's info grid, category/critère tables, and decision banner at the current y. */
function dessinerCorpsEvaluation(ctx: Ctx, data: EvaluationExportData) {
  ligne(ctx, 'Boutique', data.boutiqueNom);
  ligne(ctx, 'Personne', data.personneNom);
  ligne(ctx, 'Période', data.periode);
  ligne(ctx, 'Statut', data.statutLabel);
  ligne(ctx, 'Évaluateur', data.evaluateurEmail);
  ligne(ctx, 'Date de soumission', data.dateSoumission ? data.dateSoumission.toLocaleDateString('fr-FR') : 'Non soumise');
  ctx.y -= 10;

  const colCritere = MARGIN;
  const colScore = MARGIN + CONTENT_WIDTH - 220;
  const colCommentaire = MARGIN + CONTENT_WIDTH - 190;
  const largeurCritere = colScore - colCritere - 10;
  const largeurCommentaire = CONTENT_WIDTH - (colCommentaire - MARGIN);

  for (const categorie of data.categories) {
    assurerEspace(ctx, 50);
    ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 4, width: CONTENT_WIDTH, height: 20, color: COULEURS.brandTint });
    ctx.page.drawText(categorie.nom.toUpperCase(), {
      x: MARGIN + 6,
      y: ctx.y + 1,
      size: 10,
      font: ctx.bold,
      color: COULEURS.brandPrimary,
    });
    ctx.y -= 26;

    ctx.page.drawText('Critère', { x: colCritere, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
    ctx.page.drawText('Score', { x: colScore, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
    ctx.page.drawText('Commentaire', { x: colCommentaire, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
    ctx.y -= 4;
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y },
      end: { x: MARGIN + CONTENT_WIDTH, y: ctx.y },
      thickness: 0.75,
      color: COULEURS.border,
    });
    ctx.y -= 12;

    for (const critere of categorie.criteres) {
      const lignesLibelle = wrapText(critere.libelle, ctx.regular, 9, largeurCritere);
      const lignesCommentaire = critere.commentaire ? wrapText(critere.commentaire, ctx.regular, 9, largeurCommentaire) : [];
      const nbLignes = Math.max(lignesLibelle.length, lignesCommentaire.length, 1);
      const hauteurLigne = nbLignes * 12 + 6;

      assurerEspace(ctx, hauteurLigne);

      lignesLibelle.forEach((texte, i) => {
        ctx.page.drawText(texte, {
          x: colCritere,
          y: ctx.y - i * 12,
          size: 9,
          font: ctx.regular,
          color: COULEURS.textPrimary,
        });
      });
      ctx.page.drawText(critere.score !== null ? String(critere.score) : '—', {
        x: colScore,
        y: ctx.y,
        size: 9,
        font: ctx.bold,
        color: COULEURS.textPrimary,
      });
      lignesCommentaire.forEach((texte, i) => {
        ctx.page.drawText(texte, {
          x: colCommentaire,
          y: ctx.y - i * 12,
          size: 9,
          font: ctx.regular,
          color: COULEURS.textMuted,
        });
      });

      ctx.y -= hauteurLigne;
      ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y + 4 },
        end: { x: MARGIN + CONTENT_WIDTH, y: ctx.y + 4 },
        thickness: 0.5,
        color: COULEURS.border,
      });
    }
    ctx.y -= 14;
  }

  assurerEspace(ctx, 60);
  const scoreLabel = data.scoreMax ? `${formaterScore(data.scoreTotal)} / ${data.scoreMax}` : formaterScore(data.scoreTotal);
  ctx.page.drawRectangle({ x: MARGIN, y: ctx.y - 34, width: CONTENT_WIDTH, height: 40, color: couleurDecision(data.categorieDecision) });
  ctx.page.drawText(`Score total : ${scoreLabel}`, { x: MARGIN + 12, y: ctx.y - 14, size: 11, font: ctx.bold, color: COULEURS.white });
  ctx.page.drawText(data.decisionRh, { x: MARGIN + 12, y: ctx.y - 28, size: 10, font: ctx.regular, color: COULEURS.white });
  ctx.y -= 50;
}

export async function genererEvaluationPdf(data: EvaluationExportData): Promise<Buffer> {
  const ctx = await creerContexte();
  dessinerEnTete(ctx, `Évaluation ${data.posteLabel}`);
  dessinerCorpsEvaluation(ctx, data);
  return Buffer.from(await ctx.doc.save());
}

export async function genererBoutiqueExportPdf(data: BoutiqueExportData): Promise<Buffer> {
  const ctx = await creerContexte();
  dessinerEnTete(ctx, `Évaluations — ${data.boutiqueNom}`);

  ligne(ctx, 'Boutique', data.boutiqueNom);
  ligne(ctx, 'Période', data.periode);
  ligne(ctx, 'Généré le', data.genereLe.toLocaleDateString('fr-FR'));
  ctx.y -= 10;

  // --- Summary table ---
  const colNom = MARGIN;
  const colPoste = MARGIN + 190;
  const colScore = MARGIN + 320;
  const colDecision = MARGIN + 380;

  ctx.page.drawText('Personne', { x: colNom, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
  ctx.page.drawText('Poste', { x: colPoste, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
  ctx.page.drawText('Score', { x: colScore, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
  ctx.page.drawText('Décision RH', { x: colDecision, y: ctx.y, size: 8, font: ctx.bold, color: COULEURS.textMuted });
  ctx.y -= 4;
  ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: MARGIN + CONTENT_WIDTH, y: ctx.y }, thickness: 0.75, color: COULEURS.border });
  ctx.y -= 14;

  for (const ligneP of data.lignes) {
    assurerEspace(ctx, 18);
    const scoreLabel = ligneP.scoreMax ? `${formaterScore(ligneP.scoreTotal)} / ${ligneP.scoreMax}` : formaterScore(ligneP.scoreTotal);
    ctx.page.drawText(ligneP.personneNom, { x: colNom, y: ctx.y, size: 9, font: ctx.regular, color: COULEURS.textPrimary });
    ctx.page.drawText(ligneP.posteLabel, { x: colPoste, y: ctx.y, size: 9, font: ctx.regular, color: COULEURS.textMuted });
    ctx.page.drawText(scoreLabel, { x: colScore, y: ctx.y, size: 9, font: ctx.bold, color: COULEURS.textPrimary });
    ctx.page.drawCircle({ x: colDecision - 8, y: ctx.y + 3, size: 3, color: couleurDecision(ligneP.categorieDecision) });
    ctx.page.drawText(ligneP.decisionRh, { x: colDecision, y: ctx.y, size: 8.5, font: ctx.regular, color: COULEURS.textPrimary });
    ctx.y -= 16;
    ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y + 6 }, end: { x: MARGIN + CONTENT_WIDTH, y: ctx.y + 6 }, thickness: 0.5, color: COULEURS.border });
  }

  // --- One detailed section per person who has a submitted evaluation ---
  for (const ligneP of data.lignes) {
    if (!ligneP.detail) continue;
    nouvellePage(ctx);
    dessinerEnTete(ctx, `${ligneP.personneNom} — ${ligneP.posteLabel}`);
    dessinerCorpsEvaluation(ctx, ligneP.detail);
  }

  return Buffer.from(await ctx.doc.save());
}
