-- CreateEnum
CREATE TYPE "Poste" AS ENUM ('GERANT', 'ADJOINT', 'VENDEUR', 'FEMME_MENAGE', 'VOITURIER', 'CHAUFFEUR');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('CDI', 'CDD', 'PRESTATION');

-- CreateEnum
CREATE TYPE "ProfilEvaluation" AS ENUM ('GERANT', 'VENDEUR');

-- CreateEnum
CREATE TYPE "StatutEvaluation" AS ENUM ('BROUILLON', 'SOUMISE', 'VALIDEE');

-- CreateEnum
CREATE TYPE "StatutPlanAction" AS ENUM ('OUVERT', 'EN_COURS', 'CLOS');

-- CreateEnum
CREATE TYPE "RoleUtilisateur" AS ENUM ('ADMIN_RH', 'DIRECTEUR_REGIONAL', 'GERANT');

-- CreateTable
CREATE TABLE "boutiques" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ca_prevision" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boutiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnes" (
    "id" TEXT NOT NULL,
    "boutique_id" TEXT NOT NULL,
    "nom_complet" TEXT NOT NULL,
    "poste" "Poste" NOT NULL,
    "type_contrat" "TypeContrat" NOT NULL,
    "anciennete_annees" DECIMAL(5,2) NOT NULL,
    "salaire_net" DECIMAL(10,2) NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grilles_poste" (
    "id" TEXT NOT NULL,
    "nom_poste" TEXT NOT NULL,
    "effectif_min" INTEGER NOT NULL,
    "effectif_max" INTEGER NOT NULL,
    "salaire_net_moyen" DECIMAL(10,2) NOT NULL,
    "niveau_etudes" TEXT NOT NULL,
    "experience_requise" TEXT NOT NULL,
    "competences_cles" TEXT NOT NULL,
    "mission_client_dediee" TEXT NOT NULL,

    CONSTRAINT "grilles_poste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories_evaluation" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "applicable_a" "ProfilEvaluation" NOT NULL,
    "ordre_affichage" INTEGER NOT NULL,

    CONSTRAINT "categories_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteres_evaluation" (
    "id" TEXT NOT NULL,
    "categorie_id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre_affichage" INTEGER NOT NULL,

    CONSTRAINT "criteres_evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "personne_id" TEXT NOT NULL,
    "evaluateur_id" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "statut" "StatutEvaluation" NOT NULL DEFAULT 'BROUILLON',
    "date_soumission" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scores_critere" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "critere_id" TEXT NOT NULL,
    "score" INTEGER,
    "commentaire" TEXT,

    CONSTRAINT "scores_critere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baremes_notation" (
    "id" TEXT NOT NULL,
    "type_profil" "ProfilEvaluation" NOT NULL,
    "borne_min" DECIMAL(6,2) NOT NULL,
    "borne_max" DECIMAL(6,2) NOT NULL,
    "decision_rh" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "baremes_notation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans_action_rh" (
    "id" TEXT NOT NULL,
    "personne_id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "score_actuel" DECIMAL(6,2),
    "decision_rh" TEXT NOT NULL,
    "formation_prioritaire" TEXT NOT NULL,
    "delai_revue" TEXT NOT NULL,
    "date_suivi" TIMESTAMP(3) NOT NULL,
    "decision_finale" TEXT,
    "statut" "StatutPlanAction" NOT NULL DEFAULT 'OUVERT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_action_rh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "role" "RoleUtilisateur" NOT NULL,
    "boutique_id" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_audit" (
    "id" TEXT NOT NULL,
    "utilisateur_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entite_id" TEXT NOT NULL,
    "details_avant" JSONB,
    "details_apres" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "personnes_boutique_id_idx" ON "personnes"("boutique_id");

-- CreateIndex
CREATE INDEX "criteres_evaluation_categorie_id_idx" ON "criteres_evaluation"("categorie_id");

-- CreateIndex
CREATE INDEX "evaluations_personne_id_idx" ON "evaluations"("personne_id");

-- CreateIndex
CREATE INDEX "evaluations_evaluateur_id_idx" ON "evaluations"("evaluateur_id");

-- CreateIndex
CREATE INDEX "scores_critere_evaluation_id_idx" ON "scores_critere"("evaluation_id");

-- CreateIndex
CREATE UNIQUE INDEX "scores_critere_evaluation_id_critere_id_key" ON "scores_critere"("evaluation_id", "critere_id");

-- CreateIndex
CREATE INDEX "baremes_notation_type_profil_idx" ON "baremes_notation"("type_profil");

-- CreateIndex
CREATE INDEX "plans_action_rh_personne_id_idx" ON "plans_action_rh"("personne_id");

-- CreateIndex
CREATE INDEX "plans_action_rh_evaluation_id_idx" ON "plans_action_rh"("evaluation_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_boutique_id_idx" ON "utilisateurs"("boutique_id");

-- CreateIndex
CREATE INDEX "journal_audit_utilisateur_id_idx" ON "journal_audit"("utilisateur_id");

-- CreateIndex
CREATE INDEX "journal_audit_entite_entite_id_idx" ON "journal_audit"("entite", "entite_id");

-- AddForeignKey
ALTER TABLE "personnes" ADD CONSTRAINT "personnes_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteres_evaluation" ADD CONSTRAINT "criteres_evaluation_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories_evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_personne_id_fkey" FOREIGN KEY ("personne_id") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_evaluateur_id_fkey" FOREIGN KEY ("evaluateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores_critere" ADD CONSTRAINT "scores_critere_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scores_critere" ADD CONSTRAINT "scores_critere_critere_id_fkey" FOREIGN KEY ("critere_id") REFERENCES "criteres_evaluation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans_action_rh" ADD CONSTRAINT "plans_action_rh_personne_id_fkey" FOREIGN KEY ("personne_id") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans_action_rh" ADD CONSTRAINT "plans_action_rh_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_boutique_id_fkey" FOREIGN KEY ("boutique_id") REFERENCES "boutiques"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

