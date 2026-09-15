// Excel treats any cell starting with = + - @ (or a tab/CR) as a formula. HR data
// exported from the API is partly user-entered (commentaires, noms, libellés), so a
// malicious value like `=HYPERLINK("https://evil.example")` would otherwise execute
// when someone opens the workbook. Prefixed cell values render literally - Excel drops
// the leading apostrophe from display and never evaluates the content.
const CARACTERES_SUSPECTS = ['=', '+', '-', '@', '\t', '\r'];

export function protegerFormule(texte: string): string {
  if (texte.length === 0) return texte;
  const premier = texte[0];
  if (CARACTERES_SUSPECTS.includes(premier)) {
    return `'${texte}`;
  }
  return texte;
}