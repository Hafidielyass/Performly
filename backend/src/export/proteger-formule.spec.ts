import { protegerFormule } from './proteger-formule';

describe('protegerFormule', () => {
  it('laisse inchangé un texte sans préfixe suspect', () => {
    expect(protegerFormule('Salma El Amrani')).toBe('Salma El Amrani');
    expect(protegerFormule('')).toBe('');
    expect(protegerFormule('3.5')).toBe('3.5');
    expect(protegerFormule('10%')).toBe('10%');
  });

  it('échappe chaque caractère de formule injectable en tête de cellule', () => {
    expect(protegerFormule('=HYPERLINK("https://evil.example")')).toBe(
      `'=HYPERLINK("https://evil.example")`,
    );
    expect(protegerFormule('+1+2')).toBe(`'+1+2`);
    expect(protegerFormule('-A1')).toBe(`'-A1`);
    expect(protegerFormule('@cmd')).toBe(`'@cmd`);
    expect(protegerFormule('\t=1')).toBe(`'\t=1`);
    expect(protegerFormule('\r=1')).toBe(`'\r=1`);
  });
});