import {
  PrismaClient,
  Poste,
  TypeContrat,
  ProfilEvaluation,
  RoleUtilisateur,
  StatutEvaluation,
  Personne,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'Password123!';

// Fixed evaluation grid - exactly as specified, do not invent different criteria.
const GRILLE_GERANT: { categorie: string; criteres: string[] }[] = [
  {
    categorie: 'Performance Commerciale et Ventes',
    criteres: [
      "Atteinte de l'objectif de vente",
      'Croissance / régularité des ventes',
      "Suivi de la performance commerciale de l'équipe",
      'Dynamisme commercial sur les collections/promotions',
      'Vente additionnelle / vente croisée',
    ],
  },
  {
    categorie: "Management d'Équipe et Leadership",
    criteres: [
      "Motivation de l'équipe",
      'Discipline et respect des standards',
      'Coaching et développement des collaborateurs',
      'Résolution de problèmes',
      'Leadership et autorité',
    ],
  },
  {
    categorie: 'Expérience Client',
    criteres: ['Accueil client', 'Qualité de service', 'Gestion des réclamations', 'Ambiance de la boutique'],
  },
  {
    categorie: 'Opérations et Standards de la Boutique',
    criteres: [
      'Propreté / standards de la boutique',
      "Procédures d'ouverture/fermeture",
      'Merchandising visuel',
      'Suivi des problèmes opérationnels',
    ],
  },
  {
    categorie: 'Gestion des Stocks et de la Caisse',
    criteres: [
      'Contrôle des stocks',
      'Disponibilité des produits',
      'Contrôle de la caisse',
      'Prévention des pertes/dommages',
    ],
  },
  {
    categorie: 'Développement Commercial',
    criteres: [
      'Initiative',
      'Nouvelles opportunités commerciales',
      'Développement local/VIP/B2B',
      "Anticipation des problèmes/opportunités",
    ],
  },
  {
    categorie: 'Reporting et Communication',
    criteres: ['Reporting quotidien/hebdomadaire', 'Communication et escalade', 'Responsabilisation'],
  },
];

const GRILLE_VENDEUR: { categorie: string; criteres: string[] }[] = [
  { categorie: 'Accueil', criteres: ['Accueil et sourire client'] },
  { categorie: 'Vente', criteres: ['Technique de vente et conclusion'] },
  { categorie: 'Produits', criteres: ['Connaissance des produits'] },
  { categorie: 'Communication', criteres: ['Communication avec la clientèle et l\'équipe'] },
  { categorie: 'Discipline', criteres: ['Ponctualité, tenue et respect des règles'] },
  { categorie: 'Initiative', criteres: ['Initiative et proactivité'] },
];

const BOUTIQUES = [
  { nom: 'Ghandi', slug: 'ghandi' },
  { nom: 'Oasis', slug: 'oasis' },
  { nom: 'Marrakech', slug: 'marrakech' },
  { nom: 'Rabat', slug: 'rabat' },
  { nom: 'Racine', slug: 'racine' },
];

const PRENOMS_F = ['Salma', 'Imane', 'Fatima-Zahra', 'Kenza', 'Nisrine', 'Ghita', 'Zineb', 'Meryem'];
const PRENOMS_M = ['Youssef', 'Hamza', 'Karim', 'Reda', 'Anas', 'Mehdi', 'Amine', 'Othmane'];
const NOMS = ['El Amrani', 'Bennani', 'Tazi', 'Alaoui', 'Berrada', 'Fassi', 'Idrissi', 'Benjelloun'];

function nomAleatoire(index: number): string {
  const prenoms = index % 2 === 0 ? PRENOMS_F : PRENOMS_M;
  const prenom = prenoms[index % prenoms.length];
  const nom = NOMS[(index * 3) % NOMS.length];
  return `${prenom} ${nom}`;
}

async function dejaSeed(): Promise<boolean> {
  const count = await prisma.boutique.count();
  return count > 0;
}

async function seedGrille(
  grille: { categorie: string; criteres: string[] }[],
  applicableA: ProfilEvaluation,
): Promise<Map<string, string>> {
  const critereIdParLibelle = new Map<string, string>();
  for (let i = 0; i < grille.length; i++) {
    const { categorie, criteres } = grille[i];
    const created = await prisma.categorieEvaluation.create({
      data: { nom: categorie, applicableA, ordreAffichage: i + 1 },
    });
    for (let j = 0; j < criteres.length; j++) {
      const critere = await prisma.critereEvaluation.create({
        data: { categorieId: created.id, libelle: criteres[j], ordreAffichage: j + 1 },
      });
      critereIdParLibelle.set(criteres[j], critere.id);
    }
  }
  return critereIdParLibelle;
}

async function seedBaremes() {
  await prisma.baremeNotation.createMany({
    data: [
      { typeProfil: 'GERANT', borneMin: 85, borneMax: 145, decisionRh: 'MAINTENIR – Gérant(e) Performant(e)', ordre: 1 },
      { typeProfil: 'GERANT', borneMin: 75, borneMax: 84, decisionRh: 'MAINTENIR – Plan de Développement', ordre: 2 },
      { typeProfil: 'GERANT', borneMin: 65, borneMax: 74, decisionRh: 'MAINTENIR – Plan de Formation / Amélioration', ordre: 3 },
      { typeProfil: 'GERANT', borneMin: 55, borneMax: 64, decisionRh: 'Revue de Performance Sérieuse', ordre: 4 },
      { typeProfil: 'GERANT', borneMin: 0, borneMax: 54, decisionRh: 'REMPLACER / Envisager un Recrutement', ordre: 5 },
      { typeProfil: 'VENDEUR', borneMin: 4.5, borneMax: 5, decisionRh: 'MAINTENIR - Excellent, filière promotion', ordre: 1 },
      { typeProfil: 'VENDEUR', borneMin: 3.5, borneMax: 4.49, decisionRh: 'MAINTENIR - Bon, plan de développement', ordre: 2 },
      { typeProfil: 'VENDEUR', borneMin: 2.5, borneMax: 3.49, decisionRh: 'MAINTENIR - Plan de formation', ordre: 3 },
      { typeProfil: 'VENDEUR', borneMin: 1.5, borneMax: 2.49, decisionRh: 'Revue de performance sérieuse', ordre: 4 },
      { typeProfil: 'VENDEUR', borneMin: 0, borneMax: 1.49, decisionRh: 'REMPLACER / Envisager un recrutement', ordre: 5 },
    ],
  });
}

async function seedGrillesPoste() {
  await prisma.grillePoste.createMany({
    data: [
      {
        nomPoste: 'Gérant(e)',
        effectifMin: 1,
        effectifMax: 1,
        salaireNetMoyen: 7500,
        niveauEtudes: 'Bac+2 minimum',
        experienceRequise: '3 ans en gestion de point de vente',
        competencesCles: 'Leadership, gestion commerciale, gestion de stock',
        missionClientDediee: "Garantir l'expérience client et la performance globale de la boutique",
      },
      {
        nomPoste: 'Adjoint(e)',
        effectifMin: 0,
        effectifMax: 1,
        salaireNetMoyen: 5200,
        niveauEtudes: 'Bac+2',
        experienceRequise: '2 ans en vente',
        competencesCles: 'Supervision, vente, coordination équipe',
        missionClientDediee: 'Seconder le/la gérant(e) sur le terrain',
      },
      {
        nomPoste: 'Vendeur(se)',
        effectifMin: 2,
        effectifMax: 6,
        salaireNetMoyen: 3200,
        niveauEtudes: 'Bac',
        experienceRequise: '1 an en vente conseillée',
        competencesCles: 'Accueil, techniques de vente, connaissance produit',
        missionClientDediee: 'Conseiller et accompagner le client en boutique',
      },
      {
        nomPoste: 'Femme de Ménage',
        effectifMin: 1,
        effectifMax: 1,
        salaireNetMoyen: 2500,
        niveauEtudes: 'Non requis',
        experienceRequise: 'Non requise',
        competencesCles: 'Rigueur, propreté, discrétion',
        missionClientDediee: "Maintenir la propreté de l'espace de vente",
      },
      {
        nomPoste: 'Voiturier',
        effectifMin: 0,
        effectifMax: 1,
        salaireNetMoyen: 2700,
        niveauEtudes: 'Non requis',
        experienceRequise: 'Permis de conduire',
        competencesCles: 'Conduite, ponctualité, courtoisie',
        missionClientDediee: 'Faciliter le stationnement des clients',
      },
      {
        nomPoste: 'Chauffeur',
        effectifMin: 0,
        effectifMax: 1,
        salaireNetMoyen: 3000,
        niveauEtudes: 'Non requis',
        experienceRequise: 'Permis de conduire, 2 ans',
        competencesCles: 'Conduite, logistique, ponctualité',
        missionClientDediee: 'Assurer les livraisons et déplacements',
      },
    ],
  });
}

async function main() {
  if (await dejaSeed()) {
    console.log('Base déjà initialisée - seed ignoré.');
    return;
  }

  console.log('Seed des grilles d\'évaluation (Gérant(e) + Vendeur(se))...');
  const criteresGerant = await seedGrille(GRILLE_GERANT, 'GERANT');
  const criteresVendeur = await seedGrille(GRILLE_VENDEUR, 'VENDEUR');

  console.log('Seed des barèmes de notation...');
  await seedBaremes();

  console.log('Seed des grilles de poste...');
  await seedGrillesPoste();

  const motDePasseHash = await bcrypt.hash(DEV_PASSWORD, 10);

  console.log("Seed de l'utilisateur Admin RH et du Directeur Régional...");
  await prisma.utilisateur.create({
    data: { email: 'admin@performly.local', motDePasseHash, role: RoleUtilisateur.ADMIN_RH, boutiqueId: null },
  });
  await prisma.utilisateur.create({
    data: {
      email: 'directeur@performly.local',
      motDePasseHash,
      role: RoleUtilisateur.DIRECTEUR_REGIONAL,
      boutiqueId: null,
    },
  });

  let personneIndex = 0;
  for (const [boutiqueIndex, def] of BOUTIQUES.entries()) {
    console.log(`Seed de la boutique ${def.nom}...`);
    const boutique = await prisma.boutique.create({ data: { nom: def.nom } });

    const gerant = await prisma.personne.create({
      data: {
        boutiqueId: boutique.id,
        nomComplet: nomAleatoire(personneIndex++),
        poste: Poste.GERANT,
        typeContrat: TypeContrat.CDI,
        ancienneteAnnees: 3 + boutiqueIndex,
        salaireNet: 7500,
        actif: true,
      },
    });

    await prisma.utilisateur.create({
      data: {
        email: `gerant.${def.slug}@performly.local`,
        motDePasseHash,
        role: RoleUtilisateur.GERANT,
        boutiqueId: boutique.id,
      },
    });

    const vendeurs: Personne[] = [];
    for (let i = 0; i < 4; i++) {
      const vendeur = await prisma.personne.create({
        data: {
          boutiqueId: boutique.id,
          nomComplet: nomAleatoire(personneIndex++),
          poste: Poste.VENDEUR,
          typeContrat: i % 3 === 0 ? TypeContrat.CDD : TypeContrat.CDI,
          ancienneteAnnees: 0.5 + i,
          salaireNet: 3200,
          actif: true,
        },
      });
      vendeurs.push(vendeur);
    }

    await prisma.personne.create({
      data: {
        boutiqueId: boutique.id,
        nomComplet: nomAleatoire(personneIndex++),
        poste: Poste.FEMME_MENAGE,
        typeContrat: TypeContrat.PRESTATION,
        ancienneteAnnees: 2,
        salaireNet: 2500,
        actif: true,
      },
    });

    // Give the first two boutiques a submitted evaluation + a plan d'action so the
    // Tableau de Bord and Plan d'Action screens have real data right after `up`.
    if (boutiqueIndex < 2) {
      const evaluateur = await prisma.utilisateur.findFirstOrThrow({ where: { email: 'admin@performly.local' } });

      const evaluationGerant = await prisma.evaluation.create({
        data: {
          personneId: gerant.id,
          evaluateurId: evaluateur.id,
          periode: '2026-T2',
          statut: StatutEvaluation.SOUMISE,
          dateSoumission: new Date(),
        },
      });
      // A strong-performing Gérant(e): mostly 4s and 5s across the 29 criteria.
      let i = 0;
      for (const critereId of criteresGerant.values()) {
        const score = i % 5 === 0 ? 4 : 5;
        await prisma.scoreCritere.create({ data: { evaluationId: evaluationGerant.id, critereId, score } });
        i++;
      }

      const vendeurFaible = vendeurs[0];
      const evaluationVendeur = await prisma.evaluation.create({
        data: {
          personneId: vendeurFaible.id,
          evaluateurId: evaluateur.id,
          periode: '2026-T2',
          statut: StatutEvaluation.SOUMISE,
          dateSoumission: new Date(),
        },
      });
      // A struggling Vendeur(se): low scores to trigger a "Revue de performance" plan d'action.
      const scoresFaibles = [2, 2, 1, 2, 3, 2];
      let j = 0;
      for (const critereId of criteresVendeur.values()) {
        await prisma.scoreCritere.create({
          data: { evaluationId: evaluationVendeur.id, critereId, score: scoresFaibles[j] ?? 2 },
        });
        j++;
      }

      await prisma.planActionRH.create({
        data: {
          personneId: vendeurFaible.id,
          evaluationId: evaluationVendeur.id,
          scoreActuel: 2,
          decisionRh: 'Revue de performance sérieuse',
          formationPrioritaire: 'Techniques de vente et conclusion',
          delaiRevue: '30 jours',
          dateSuivi: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          statut: 'OUVERT',
        },
      });
    }
  }

  console.log('Seed terminé.');
  console.log(`Mot de passe de développement pour tous les comptes créés: ${DEV_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
