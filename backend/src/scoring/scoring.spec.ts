import { BaremeRange, calculerScoreGerant, calculerScoreVendeur, categoriserDecision, resoudreDecisionRH } from './scoring';

const BAREMES_GERANT: BaremeRange[] = [
  { typeProfil: 'GERANT', borneMin: 85, borneMax: 145, decisionRh: 'MAINTENIR – Gérant(e) Performant(e)' },
  { typeProfil: 'GERANT', borneMin: 75, borneMax: 84, decisionRh: 'MAINTENIR – Plan de Développement' },
  { typeProfil: 'GERANT', borneMin: 65, borneMax: 74, decisionRh: 'MAINTENIR – Plan de Formation / Amélioration' },
  { typeProfil: 'GERANT', borneMin: 55, borneMax: 64, decisionRh: 'Revue de Performance Sérieuse' },
  { typeProfil: 'GERANT', borneMin: 0, borneMax: 54, decisionRh: 'REMPLACER / Envisager un Recrutement' },
];

const BAREMES_VENDEUR: BaremeRange[] = [
  { typeProfil: 'VENDEUR', borneMin: 4.5, borneMax: 5, decisionRh: 'MAINTENIR - Excellent, filière promotion' },
  { typeProfil: 'VENDEUR', borneMin: 3.5, borneMax: 4.49, decisionRh: 'MAINTENIR - Bon, plan de développement' },
  { typeProfil: 'VENDEUR', borneMin: 2.5, borneMax: 3.49, decisionRh: 'MAINTENIR - Plan de formation' },
  { typeProfil: 'VENDEUR', borneMin: 1.5, borneMax: 2.49, decisionRh: 'Revue de performance sérieuse' },
  { typeProfil: 'VENDEUR', borneMin: 0, borneMax: 1.49, decisionRh: 'REMPLACER / Envisager un recrutement' },
];

describe('calculerScoreGerant', () => {
  it('returns null when every criterion is unscored', () => {
    expect(calculerScoreGerant([null, null, null])).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(calculerScoreGerant([])).toBeNull();
  });

  it('sums only the entered scores, ignoring blanks (never a percentage)', () => {
    expect(calculerScoreGerant([5, null, 3, null, 4])).toBe(12);
  });

  it('sums all scores when every criterion is filled', () => {
    const scores = Array(29).fill(5);
    expect(calculerScoreGerant(scores)).toBe(145);
  });
});

describe('calculerScoreVendeur', () => {
  it('returns null when every criterion is unscored', () => {
    expect(calculerScoreVendeur([null, null])).toBeNull();
  });

  it('averages only the entered scores', () => {
    expect(calculerScoreVendeur([5, null, 3])).toBe(4);
  });

  it('produces a non-integer average', () => {
    expect(calculerScoreVendeur([5, 4, 4])).toBeCloseTo(4.333, 3);
  });
});

describe('resoudreDecisionRH', () => {
  it('resolves a null score to "Pas encore évalué(e)", never the lowest band', () => {
    expect(resoudreDecisionRH(null, 'GERANT', BAREMES_GERANT)).toBe('Pas encore évalué(e)');
    expect(resoudreDecisionRH(null, 'VENDEUR', BAREMES_VENDEUR)).toBe('Pas encore évalué(e)');
  });

  describe('Gérant(e) band boundaries (inclusive)', () => {
    it.each([
      [100, 'MAINTENIR – Gérant(e) Performant(e)'],
      [85, 'MAINTENIR – Gérant(e) Performant(e)'],
      [84, 'MAINTENIR – Plan de Développement'],
      [75, 'MAINTENIR – Plan de Développement'],
      [74, 'MAINTENIR – Plan de Formation / Amélioration'],
      [65, 'MAINTENIR – Plan de Formation / Amélioration'],
      [64, 'Revue de Performance Sérieuse'],
      [55, 'Revue de Performance Sérieuse'],
      [54, 'REMPLACER / Envisager un Recrutement'],
      [0, 'REMPLACER / Envisager un Recrutement'],
    ])('score %i -> %s', (score, expected) => {
      expect(resoudreDecisionRH(score, 'GERANT', BAREMES_GERANT)).toBe(expected);
    });
  });

  describe('Vendeur(se) band boundaries (inclusive)', () => {
    it.each([
      [5, 'MAINTENIR - Excellent, filière promotion'],
      [4.5, 'MAINTENIR - Excellent, filière promotion'],
      [4.49, 'MAINTENIR - Bon, plan de développement'],
      [3.5, 'MAINTENIR - Bon, plan de développement'],
      [3.49, 'MAINTENIR - Plan de formation'],
      [2.5, 'MAINTENIR - Plan de formation'],
      [2.49, 'Revue de performance sérieuse'],
      [1.5, 'Revue de performance sérieuse'],
      [1.49, 'REMPLACER / Envisager un recrutement'],
      [0, 'REMPLACER / Envisager un recrutement'],
    ])('score %s -> %s', (score, expected) => {
      expect(resoudreDecisionRH(score, 'VENDEUR', BAREMES_VENDEUR)).toBe(expected);
    });
  });

  it('returns "Non classé" if a score somehow falls outside every configured band', () => {
    const gappyBaremes: BaremeRange[] = [{ typeProfil: 'GERANT', borneMin: 90, borneMax: 100, decisionRh: 'X' }];
    expect(resoudreDecisionRH(10, 'GERANT', gappyBaremes)).toBe('Non classé');
  });
});

describe('categoriserDecision', () => {
  it('maps REMPLACER decisions to danger', () => {
    expect(categoriserDecision('REMPLACER / Envisager un Recrutement')).toBe('danger');
  });

  it('maps "Revue de ..." decisions to warning', () => {
    expect(categoriserDecision('Revue de Performance Sérieuse')).toBe('warning');
  });

  it('maps MAINTENIR decisions to success', () => {
    expect(categoriserDecision('MAINTENIR – Gérant(e) Performant(e)')).toBe('success');
  });

  it('maps anything else (not yet evaluated, unclassified) to neutral', () => {
    expect(categoriserDecision('Pas encore évalué(e)')).toBe('neutral');
    expect(categoriserDecision('Non classé')).toBe('neutral');
  });
});
