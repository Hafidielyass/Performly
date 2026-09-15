export type Poste = 'GERANT' | 'ADJOINT' | 'VENDEUR' | 'FEMME_MENAGE' | 'VOITURIER' | 'CHAUFFEUR';
export type TypeContrat = 'CDI' | 'CDD' | 'PRESTATION';
export type ProfilEvaluation = 'GERANT' | 'VENDEUR';
export type StatutEvaluation = 'BROUILLON' | 'SOUMISE' | 'VALIDEE';
export type StatutPlanAction = 'OUVERT' | 'EN_COURS' | 'CLOS';
export type RoleUtilisateur = 'ADMIN_RH' | 'DIRECTEUR_REGIONAL' | 'GERANT';
export type CategorieDecision = 'success' | 'warning' | 'danger' | 'neutral';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: RoleUtilisateur;
  boutiqueId: string | null;
}

export interface Boutique {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

export interface Personne {
  id: string;
  boutiqueId: string;
  nomComplet: string;
  poste: Poste;
  typeContrat: TypeContrat;
  ancienneteAnnees: string;
  salaireNet: string;
  actif: boolean;
}

export interface LigneImportIgnoree {
  ligne: number;
  nom: string;
  raison: string;
}

export interface ResultatImportPersonnes {
  ajoutes: number;
  ignorees: LigneImportIgnoree[];
}

export interface GrillePoste {
  id: string;
  nomPoste: string;
  effectifMin: number;
  effectifMax: number;
  salaireNetMoyen: string;
  niveauEtudes: string;
  experienceRequise: string;
  competencesCles: string;
  missionClientDediee: string;
}

export interface CritereEvaluation {
  id: string;
  categorieId: string;
  libelle: string;
  ordreAffichage: number;
}

export interface CategorieEvaluation {
  id: string;
  nom: string;
  applicableA: ProfilEvaluation;
  ordreAffichage: number;
  criteres: CritereEvaluation[];
}

export interface ScoreCritere {
  id: string;
  evaluationId: string;
  critereId: string;
  score: number | null;
  commentaire: string | null;
}

export interface Evaluation {
  id: string;
  personneId: string;
  evaluateurId: string;
  periode: string;
  statut: StatutEvaluation;
  dateSoumission: string | null;
  scores: ScoreCritere[];
  personne?: Personne;
  scoreTotal: number | null;
  decisionRh: string;
}

export interface BaremeNotation {
  id: string;
  typeProfil: ProfilEvaluation;
  borneMin: string;
  borneMax: string;
  decisionRh: string;
  ordre: number;
}

export interface PlanActionRH {
  id: string;
  personneId: string;
  evaluationId: string;
  scoreActuel: string | null;
  decisionRh: string;
  formationPrioritaire: string;
  delaiRevue: string;
  dateSuivi: string;
  decisionFinale: string | null;
  statut: StatutPlanAction;
  personne?: Personne;
}

export interface DashboardLignePersonne {
  personneId: string;
  nomComplet: string;
  poste: Poste;
  scoreActuel: number | null;
  decisionRh: string;
  categorie: CategorieDecision;
  derniereEvaluationId: string | null;
  periode: string | null;
}

export interface DashboardBoutique {
  boutique: Boutique;
  effectifTotal: number;
  repartition: Record<CategorieDecision, number>;
  personnes: DashboardLignePersonne[];
}

export interface DashboardConsolideLigne {
  boutiqueId: string;
  nom: string;
  effectifTotal: number;
  repartition: Record<CategorieDecision, number>;
}

export interface CritereHistorique {
  critereId: string;
  libelle: string;
  categorieNom: string;
  categorieOrdre: number;
  ordreAffichage: number;
  score: number | null;
}

export interface EvaluationHistorique {
  id: string;
  periode: string;
  statut: StatutEvaluation;
  dateSoumission: string | null;
  scoreTotal: number | null;
  decisionRh: string;
  categorieDecision: CategorieDecision;
  criteres: CritereHistorique[];
}

export interface HistoriquePersonne {
  personne: Personne;
  profil: ProfilEvaluation | null;
  scoreMax: number | null;
  evaluations: EvaluationHistorique[];
}

export interface Utilisateur {
  id: string;
  email: string;
  role: RoleUtilisateur;
  boutiqueId: string | null;
  actif: boolean;
  createdAt: string;
}
