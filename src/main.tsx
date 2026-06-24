import React from "react";
import ReactDOM from "react-dom/client";
import { AlertTriangle, Clipboard, Clock, HelpCircle, Layers, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import "./styles.css";

type FrameworkId = "cefr-ccc" | "pfl2-sle";
type CEFRLevel = "A1" | "A2" | "B1" | "B1+" | "B2" | "B2+" | "C1" | "C1+" | "C2";
type SLELevel = "A-" | "A" | "A+" | "B-" | "B" | "B+" | "C-" | "C" | "C+";
type AssessmentLevel = CEFRLevel | SLELevel;

interface CandidateInfo {
  fullName: string;
  email: string;
  client: string;
  assessmentLanguage: string;
  assessmentType: string;
  assessmentDate: string;
  evaluatorName: string;
  mode: "Microsoft Teams";
  positionContext?: string;
  targetLevel?: string;
  preAssessmentNotes?: string;
}

interface CriterionRating {
  comprehensionQuestions: AssessmentLevel | "";
  fluency: AssessmentLevel | "";
  interaction: AssessmentLevel | "";
  grammar: AssessmentLevel | "";
  vocabulary: AssessmentLevel | "";
  coherence: AssessmentLevel | "";
  pronunciation: AssessmentLevel | "";
  justification: AssessmentLevel | "";
  abstraction: AssessmentLevel | "";
  finalLevel: AssessmentLevel | "";
}

interface AssessmentNotes {
  generalObservations: string;
  strengths: string;
  challenges: string;
  preciseErrors: string;
  strongPerformanceExamples: string;
  finalJudgment: string;
}

type TrainingEstimateMode = "auto" | "of" | "none";

type TrainingEstimateSettings = {
  mode: TrainingEstimateMode;
  point: string;
};

interface OralAssessmentSession {
  id: string;
  frameworkId: FrameworkId;
  candidate: CandidateInfo;
  ratings: CriterionRating;
  notes: AssessmentNotes;
  selectedStage: string;
  summary: string;
  cExtensionEnabled?: boolean;
  trainingEstimate: TrainingEstimateSettings;
  createdAt: string;
  updatedAt: string;
}

type CriterionKey = Exclude<keyof CriterionRating, "finalLevel">;
type NotesKey = keyof AssessmentNotes;
type NoteMode = "auto" | "manual";
type TagView = "frequent" | "global" | "improve" | "strengths" | "examples";
type ViewMode = "live" | "finalize";
type TagState = "inactive" | "normal" | "strong";
type PerformanceKey = "comprehension" | "autonomy" | "complexity" | "precision";
type PerformanceValue = 0 | 1 | 2 | 3;
type StoredDraft = Partial<OralAssessmentSession> & {
  performance?: Partial<Record<PerformanceKey, PerformanceValue>>;
};
type TagStats = {
  total: number;
  challenge: number;
  neutral: number;
  strength: number;
  strongIntensity: number;
};
type ActiveTagEvidence = {
  group: QuickTagGroup;
  tag: string;
  state: Exclude<TagState, "inactive">;
};
type CriterionSuggestion = {
  level: AssessmentLevel | "";
  confidence: "low" | "medium" | "high";
  reasons: string[];
};
type MissingEvidenceCriterion = {
  key: CriterionKey;
  label: string;
};
type SuggestionRule = {
  tag: string;
  criteria: CriterionKey[];
  score: number;
  reason: string;
};
type JudgmentPhrase = {
  id: string;
  category: "Conclusion" | "Preuves" | "Nuance" | "Contexte professionnel" | "Prudence";
  title: string;
  text: string;
};
type CProbe = {
  title: string;
  prompt: string;
  focus: string;
};

type Stage = {
  id: string;
  label: string;
  title: string;
  time: string;
  optional?: boolean;
  purpose: string[];
  main: string[];
  followUps?: string[];
  deepening?: string[];
  easier?: string[];
  advanced?: string[];
  alternatives?: string[];
  focus: string[];
};

type QuickTagGroup = {
  title: string;
  description: string;
  target: NotesKey;
  prefix?: string;
  tone: "challenge" | "neutral" | "strength";
  view: Exclude<TagView, "frequent">;
  tags: string[];
};

type NoteField = {
  key: NotesKey;
  label: string;
  placeholder: string;
  mode: NoteMode;
  helper: string;
};

type FrameworkConfig = {
  id: FrameworkId;
  selectorLabel: string;
  modeLabel: string;
  appTitle: string;
  defaultClient: string;
  ratingTitle: string;
  ratingAriaLabel: string;
  ratingHelp: string;
  finalProfileLabel: string;
  summaryTitle: string;
  summaryButtonLabel: string;
  summaryPlaceholder: string;
  summaryReportTarget: string;
  unconfirmedLevelNote: string;
  disclaimer?: string;
  levels: AssessmentLevel[];
  levelValues: Record<string, number>;
  criteria: { key: CriterionKey; label: string }[];
  descriptors: Record<CriterionKey, Partial<Record<AssessmentLevel, string>>>;
  reportTemplates: Partial<Record<AssessmentLevel, string>>;
  levelProfileLines: Partial<Record<AssessmentLevel, string>>;
  recommendationTemplates: Record<string, string[]>;
  stages: Stage[];
  quickTagGroups: QuickTagGroup[];
  frequentTagValues: string[];
  tagLabels: Record<string, string>;
  tagSuggestionRules: SuggestionRule[];
  performanceSuggestionRules: Record<
    PerformanceKey,
    Partial<Record<PerformanceValue, { criteria: CriterionKey[]; score: number; reason: string }>>
  >;
  cProbeQuestions: CProbe[];
  guideSteps: string[];
};

const STORAGE_KEY = "kc-oral-assessment-console-draft";
const AUTO_SAVE_INTERVAL_MS = 25000;

const performanceSignals: { key: PerformanceKey; label: string }[] = [
  { key: "comprehension", label: "Compréhension" },
  { key: "autonomy", label: "Autonomie" },
  { key: "complexity", label: "Complexité" },
  { key: "precision", label: "Précision" },
];

const performanceLabels: Record<PerformanceValue, string> = {
  0: "À confirmer",
  1: "Fragile",
  2: "Fonctionnel",
  3: "Solide",
};

const defaultTrainingEstimate: TrainingEstimateSettings = {
  mode: "auto",
  point: "",
};

const pfl2AutoTrainingEstimates: Record<
  SLELevel,
  { label: string; toB: string; toC: string }
> = {
  "A-": {
    label: "A- / pré-OF01",
    toB: "environ 36 à 48 semaines selon le rythme de formation",
    toC: "environ 54 à 72 semaines selon le rythme de formation",
  },
  A: {
    label: "A / OF01-OF12 environ",
    toB: "environ 28 à 48 semaines selon le point de départ réel",
    toC: "environ 46 à 72 semaines selon le point de départ réel",
  },
  "A+": {
    label: "A+ / OF13-OF40 environ, zone pré-B",
    toB: "environ 1 à 36 semaines vers le repère B / OF40-pré-B, à confirmer par la performance orale",
    toC: "environ 19 à 60 semaines selon le point OF réel",
  },
  "B-": {
    label: "B- / proche B, mais instable",
    toB: "consolidation courte à prévoir avant de confirmer un B fonctionnel stable",
    toC: "environ 19 à 36 semaines selon le point de départ réel et la stabilité du B",
  },
  B: {
    label: "B / niveau fonctionnel confirmé",
    toB: "niveau B atteint selon l'évaluation finale",
    toC: "environ 18 à 24 semaines vers C selon le rythme et la progression réelle",
  },
  "B+": {
    label: "B+ / transition vers C",
    toB: "niveau B atteint selon l'évaluation finale",
    toC: "environ 9 à 18 semaines vers C selon le rythme et la progression réelle",
  },
  "C-": {
    label: "C- / proche C, mais instable",
    toB: "niveau B atteint selon l'évaluation finale",
    toC: "consolidation ciblée à prévoir avant de confirmer un C fonctionnel stable",
  },
  C: {
    label: "C / niveau fonctionnel confirmé",
    toB: "niveau B atteint selon l'évaluation finale",
    toC: "niveau C atteint selon l'évaluation finale",
  },
  "C+": {
    label: "C+ / avancé",
    toB: "niveau B atteint selon l'évaluation finale",
    toC: "niveau C atteint ou dépassé selon l'évaluation finale",
  },
};

const pfl2OfTrainingEstimates = [
  { point: "pre-of01", label: "Pré-OF01 / très grand débutant", groupB: 48, groupC: 72, ilpB: 36, ilpC: 54 },
  { point: "OF01", label: "OF01", groupB: 48, groupC: 72, ilpB: 36, ilpC: 54 },
  { point: "OF02", label: "OF02", groupB: 47, groupC: 71, ilpB: 35, ilpC: 53 },
  { point: "OF03", label: "OF03", groupB: 46, groupC: 70, ilpB: 35, ilpC: 53 },
  { point: "OF04", label: "OF04", groupB: 45, groupC: 69, ilpB: 34, ilpC: 52 },
  { point: "OF05", label: "OF05", groupB: 44, groupC: 68, ilpB: 33, ilpC: 51 },
  { point: "OF06", label: "OF06", groupB: 43, groupC: 67, ilpB: 32, ilpC: 50 },
  { point: "OF07", label: "OF07", groupB: 42, groupC: 66, ilpB: 32, ilpC: 50 },
  { point: "OF08", label: "OF08", groupB: 41, groupC: 65, ilpB: 31, ilpC: 49 },
  { point: "OF09", label: "OF09", groupB: 40, groupC: 64, ilpB: 30, ilpC: 48 },
  { point: "OF10", label: "OF10", groupB: 39, groupC: 63, ilpB: 29, ilpC: 47 },
  { point: "OF11", label: "OF11", groupB: 38, groupC: 62, ilpB: 29, ilpC: 47 },
  { point: "OF12", label: "OF12", groupB: 37, groupC: 61, ilpB: 28, ilpC: 46 },
  { point: "OF13", label: "OF13", groupB: 36, groupC: 60, ilpB: 27, ilpC: 45 },
  { point: "OF14", label: "OF14", groupB: 35, groupC: 59, ilpB: 26, ilpC: 44 },
  { point: "OF15", label: "OF15", groupB: 34, groupC: 58, ilpB: 25, ilpC: 43 },
  { point: "OF16", label: "OF16", groupB: 33, groupC: 57, ilpB: 24, ilpC: 42 },
  { point: "OF17", label: "OF17", groupB: 32, groupC: 56, ilpB: 23, ilpC: 41 },
  { point: "OF18", label: "OF18", groupB: 30, groupC: 54, ilpB: 23, ilpC: 41 },
  { point: "OF19", label: "OF19", groupB: 29, groupC: 53, ilpB: 22, ilpC: 40 },
  { point: "OF20", label: "OF20", groupB: 28, groupC: 52, ilpB: 21, ilpC: 39 },
  { point: "OF21", label: "OF21", groupB: 27, groupC: 51, ilpB: 20, ilpC: 38 },
  { point: "OF22", label: "OF22", groupB: 26, groupC: 50, ilpB: 19, ilpC: 37 },
  { point: "OF23", label: "OF23", groupB: 24, groupC: 48, ilpB: 18, ilpC: 36 },
  { point: "OF24", label: "OF24", groupB: 23, groupC: 47, ilpB: 17, ilpC: 35 },
  { point: "OF25", label: "OF25", groupB: 22, groupC: 46, ilpB: 16, ilpC: 34 },
  { point: "OF26", label: "OF26", groupB: 21, groupC: 45, ilpB: 15, ilpC: 33 },
  { point: "OF27", label: "OF27", groupB: 20, groupC: 44, ilpB: 14, ilpC: 32 },
  { point: "OF28", label: "OF28", groupB: 18, groupC: 42, ilpB: 14, ilpC: 32 },
  { point: "OF29", label: "OF29", groupB: 17, groupC: 41, ilpB: 13, ilpC: 31 },
  { point: "OF30", label: "OF30", groupB: 16, groupC: 40, ilpB: 12, ilpC: 30 },
  { point: "OF31", label: "OF31", groupB: 15, groupC: 39, ilpB: 11, ilpC: 29 },
  { point: "OF32", label: "OF32", groupB: 14, groupC: 38, ilpB: 10, ilpC: 28 },
  { point: "OF33", label: "OF33", groupB: 12, groupC: 36, ilpB: 9, ilpC: 27 },
  { point: "OF34", label: "OF34", groupB: 11, groupC: 35, ilpB: 8, ilpC: 26 },
  { point: "OF35", label: "OF35", groupB: 9, groupC: 33, ilpB: 7, ilpC: 25 },
  { point: "OF36", label: "OF36", groupB: 8, groupC: 32, ilpB: 6, ilpC: 24 },
  { point: "OF37", label: "OF37", groupB: 6, groupC: 30, ilpB: 5, ilpC: 23 },
  { point: "OF38", label: "OF38", groupB: 5, groupC: 29, ilpB: 3, ilpC: 21 },
  { point: "OF39", label: "OF39", groupB: 3, groupC: 27, ilpB: 2, ilpC: 20 },
  { point: "OF40", label: "OF40 / pré-B", groupB: 2, groupC: 26, ilpB: 1, ilpC: 19 },
];

const evaluatorGuideSteps = [
  "Remplir les renseignements, puis cliquer sur Passer à l'évaluation.",
  "Pendant l'entretien, suivre les étapes et cocher les tags rapides sans interrompre l'échange.",
  "Utiliser les repères d'observation pour confirmer la compréhension, l'autonomie, la complexité et la précision.",
  "Si l'approfondissement C apparaît, poser 1 ou 2 questions avancées et ajouter les tags C utiles.",
  "Après le départ de la personne candidate, cliquer sur Finaliser, confirmer ou modifier les niveaux CECR.",
  "Valider le niveau final, choisir une formulation, compléter l'évaluation finale et générer le résumé.",
];

const tagSuggestionRules: SuggestionRule[] = [
  {
    tag: "mots isolés",
    criteria: ["fluency", "vocabulary", "interaction"],
    score: 1.35,
    reason: "mots isolés",
  },
  {
    tag: "phrases mémorisées",
    criteria: ["fluency", "grammar", "coherence"],
    score: 1.55,
    reason: "phrases mémorisées",
  },
  {
    tag: "réponses non autonomes",
    criteria: ["interaction", "fluency", "coherence"],
    score: 1.6,
    reason: "réponses non autonomes",
  },
  {
    tag: "réponses très courtes",
    criteria: ["fluency", "coherence"],
    score: 1.8,
    reason: "réponses très courtes",
  },
  {
    tag: "soutien fréquent requis",
    criteria: ["interaction", "fluency"],
    score: 1.9,
    reason: "soutien fréquent requis",
  },
  {
    tag: "compréhension limitée sans reformulation",
    criteria: ["interaction", "coherence"],
    score: 1.7,
    reason: "compréhension limitée sans reformulation",
  },
  {
    tag: "communication difficile sans aide",
    criteria: ["interaction", "fluency", "coherence"],
    score: 1.5,
    reason: "communication difficile sans aide",
  },
  {
    tag: "rythme lent mais compréhensible",
    criteria: ["fluency", "pronunciation"],
    score: 2.3,
    reason: "rythme lent mais compréhensible",
  },
  {
    tag: "prononciation nuit à la compréhension",
    criteria: ["pronunciation"],
    score: 1.7,
    reason: "prononciation nuit à la compréhension",
  },
  {
    tag: "mots difficiles à reconnaître",
    criteria: ["pronunciation"],
    score: 2.0,
    reason: "mots difficiles à reconnaître",
  },
  {
    tag: "sons français instables",
    criteria: ["pronunciation"],
    score: 2.2,
    reason: "sons français instables",
  },
  {
    tag: "intonation peu naturelle",
    criteria: ["pronunciation"],
    score: 2.6,
    reason: "intonation peu naturelle",
  },
  {
    tag: "débit haché",
    criteria: ["pronunciation", "fluency"],
    score: 2.2,
    reason: "débit haché",
  },
  {
    tag: "articulation imprécise",
    criteria: ["pronunciation"],
    score: 2.1,
    reason: "articulation imprécise",
  },
  {
    tag: "répétitions nécessaires à cause de la prononciation",
    criteria: ["pronunciation", "interaction"],
    score: 1.9,
    reason: "répétitions nécessaires à cause de la prononciation",
  },
  {
    tag: "communication fonctionnelle",
    criteria: ["interaction", "fluency", "coherence"],
    score: 3.2,
    reason: "communication fonctionnelle",
  },
  {
    tag: "explication simple mais inégale",
    criteria: ["coherence", "fluency"],
    score: 3.45,
    reason: "explication simple mais inégale",
  },
  {
    tag: "justification de base",
    criteria: ["coherence", "interaction"],
    score: 3.5,
    reason: "justification de base",
  },
  {
    tag: "autonomie partielle",
    criteria: ["interaction", "fluency"],
    score: 3.55,
    reason: "autonomie partielle",
  },
  {
    tag: "bonne autonomie dans l'échange",
    criteria: ["interaction", "fluency"],
    score: 4.0,
    reason: "bonne autonomie dans l'échange",
  },
  {
    tag: "temps verbaux instables",
    criteria: ["grammar"],
    score: 2.2,
    reason: "temps verbaux instables",
  },
  {
    tag: "passé non maîtrisé",
    criteria: ["grammar"],
    score: 1.9,
    reason: "passé non maîtrisé",
  },
  {
    tag: "accords fréquents à corriger",
    criteria: ["grammar"],
    score: 2.4,
    reason: "accords fréquents à corriger",
  },
  {
    tag: "structure de phrase fragile",
    criteria: ["grammar", "coherence"],
    score: 2.2,
    reason: "structure de phrase fragile",
  },
  {
    tag: "vocabulaire limité",
    criteria: ["vocabulary", "fluency"],
    score: 2.0,
    reason: "vocabulaire limité",
  },
  {
    tag: "vocabulaire imprécis",
    criteria: ["vocabulary"],
    score: 2.4,
    reason: "vocabulaire imprécis",
  },
  {
    tag: "cherche souvent ses mots",
    criteria: ["vocabulary", "fluency"],
    score: 2.3,
    reason: "recherche fréquente des mots",
  },
  {
    tag: "organisation peu claire",
    criteria: ["coherence"],
    score: 2.1,
    reason: "organisation peu claire",
  },
  {
    tag: "connecteurs limités",
    criteria: ["coherence"],
    score: 2.5,
    reason: "connecteurs limités",
  },
  {
    tag: "justification faible",
    criteria: ["coherence", "interaction"],
    score: 2.4,
    reason: "justification faible",
  },
  {
    tag: "besoin de relances fréquentes",
    criteria: ["interaction"],
    score: 2.0,
    reason: "besoin de relances fréquentes",
  },
  {
    tag: "spontanéité limitée",
    criteria: ["interaction", "fluency"],
    score: 2.3,
    reason: "spontanéité limitée",
  },
  {
    tag: "difficulté à reformuler",
    criteria: ["interaction", "vocabulary"],
    score: 2.4,
    reason: "difficulté à reformuler",
  },
  {
    tag: "maîtrise des temps du passé",
    criteria: ["grammar"],
    score: 4.0,
    reason: "maîtrise des temps du passé",
  },
  {
    tag: "accords généralement maîtrisés",
    criteria: ["grammar"],
    score: 4.0,
    reason: "accords généralement maîtrisés",
  },
  {
    tag: "phrases complexes bien contrôlées",
    criteria: ["grammar", "coherence"],
    score: 4.6,
    reason: "phrases complexes bien contrôlées",
  },
  {
    tag: "riche vocabulaire",
    criteria: ["vocabulary"],
    score: 4.7,
    reason: "vocabulaire riche",
  },
  {
    tag: "vocabulaire professionnel précis",
    criteria: ["vocabulary"],
    score: 4.4,
    reason: "vocabulaire professionnel précis",
  },
  {
    tag: "bonne fluidité",
    criteria: ["fluency"],
    score: 4.2,
    reason: "bonne fluidité",
  },
  {
    tag: "bonne interaction",
    criteria: ["interaction"],
    score: 4.2,
    reason: "bonne interaction",
  },
  {
    tag: "structure claire",
    criteria: ["coherence"],
    score: 4.1,
    reason: "structure claire",
  },
  {
    tag: "bonne cohérence",
    criteria: ["coherence"],
    score: 4.2,
    reason: "bonne cohérence",
  },
  {
    tag: "prononciation généralement claire",
    criteria: ["pronunciation"],
    score: 4.0,
    reason: "prononciation généralement claire",
  },
  {
    tag: "intelligibilité constante",
    criteria: ["pronunciation"],
    score: 4.4,
    reason: "intelligibilité constante",
  },
  {
    tag: "rythme naturel",
    criteria: ["pronunciation", "fluency"],
    score: 4.5,
    reason: "rythme naturel",
  },
  {
    tag: "bonne articulation",
    criteria: ["pronunciation"],
    score: 4.2,
    reason: "bonne articulation",
  },
  {
    tag: "accent présent mais non gênant",
    criteria: ["pronunciation"],
    score: 4.0,
    reason: "accent présent mais non gênant",
  },
  {
    tag: "intonation appropriée",
    criteria: ["pronunciation"],
    score: 4.4,
    reason: "intonation appropriée",
  },
  {
    tag: "a justifié une recommandation",
    criteria: ["coherence", "interaction"],
    score: 4.2,
    reason: "recommandation justifiée",
  },
  {
    tag: "a reformulé efficacement une idée",
    criteria: ["interaction", "vocabulary"],
    score: 4.2,
    reason: "reformulation efficace",
  },
  {
    tag: "a organisé sa réponse avec des connecteurs",
    criteria: ["coherence"],
    score: 4.2,
    reason: "réponse organisée avec connecteurs",
  },
  {
    tag: "argumentation nuancée",
    criteria: ["coherence", "interaction"],
    score: 5.1,
    reason: "argumentation nuancée",
  },
  {
    tag: "nuance soutenue",
    criteria: ["coherence", "interaction", "vocabulary"],
    score: 5.45,
    reason: "nuance soutenue",
  },
  {
    tag: "souplesse discursive",
    criteria: ["fluency", "coherence", "interaction"],
    score: 5.5,
    reason: "souplesse discursive",
  },
  {
    tag: "précision soutenue",
    criteria: ["grammar", "vocabulary"],
    score: 5.55,
    reason: "précision soutenue",
  },
  {
    tag: "registre adapté au niveau exécutif",
    criteria: ["interaction", "vocabulary"],
    score: 5.2,
    reason: "registre exécutif adapté",
  },
  {
    tag: "diplomatie sous pression",
    criteria: ["interaction", "fluency"],
    score: 5.0,
    reason: "diplomatie sous pression",
  },
  {
    tag: "abstraction maîtrisée",
    criteria: ["coherence", "vocabulary"],
    score: 5.1,
    reason: "abstraction maîtrisée",
  },
  {
    tag: "vocabulaire spécialisé précis",
    criteria: ["vocabulary"],
    score: 5.3,
    reason: "vocabulaire spécialisé précis",
  },
  {
    tag: "maîtrise exceptionnelle",
    criteria: ["fluency", "grammar", "vocabulary", "coherence"],
    score: 5.85,
    reason: "maîtrise exceptionnelle",
  },
  {
    tag: "aisance quasi native",
    criteria: ["fluency", "pronunciation", "interaction"],
    score: 5.8,
    reason: "aisance quasi native",
  },
  {
    tag: "nuance constante exceptionnelle",
    criteria: ["coherence", "interaction", "vocabulary"],
    score: 5.9,
    reason: "nuance constante exceptionnelle",
  },
  {
    tag: "nuance limitée pour le niveau C",
    criteria: ["coherence", "interaction"],
    score: 4.0,
    reason: "nuance limitée pour le niveau C",
  },
  {
    tag: "registre trop simple pour C",
    criteria: ["vocabulary", "interaction"],
    score: 4.0,
    reason: "registre trop simple pour C",
  },
  {
    tag: "difficulté à soutenir une position complexe",
    criteria: ["coherence", "fluency"],
    score: 4.0,
    reason: "position complexe difficile à soutenir",
  },
];

const performanceSuggestionRules: Record<
  PerformanceKey,
  Partial<Record<PerformanceValue, { criteria: CriterionKey[]; score: number; reason: string }>>
> = {
  comprehension: {
    1: { criteria: ["interaction", "coherence"], score: 2.0, reason: "compréhension fragile" },
    2: { criteria: ["interaction", "coherence"], score: 3.4, reason: "compréhension fonctionnelle" },
    3: { criteria: ["interaction", "coherence"], score: 4.2, reason: "compréhension solide" },
  },
  autonomy: {
    1: { criteria: ["interaction", "fluency"], score: 2.0, reason: "autonomie fragile" },
    2: { criteria: ["interaction", "fluency"], score: 3.4, reason: "autonomie fonctionnelle" },
    3: { criteria: ["interaction", "fluency"], score: 4.3, reason: "autonomie solide" },
  },
  complexity: {
    1: { criteria: ["coherence", "vocabulary"], score: 2.3, reason: "complexité limitée" },
    2: { criteria: ["coherence", "vocabulary"], score: 3.5, reason: "complexité fonctionnelle" },
    3: { criteria: ["coherence", "vocabulary"], score: 4.4, reason: "complexité solide" },
  },
  precision: {
    1: { criteria: ["grammar", "vocabulary", "pronunciation"], score: 2.2, reason: "précision fragile" },
    2: { criteria: ["grammar", "vocabulary", "pronunciation"], score: 3.4, reason: "précision fonctionnelle" },
    3: { criteria: ["grammar", "vocabulary", "pronunciation"], score: 4.3, reason: "précision solide" },
  },
};

const tagViews: { key: TagView; label: string }[] = [
  { key: "frequent", label: "Fréquents" },
  { key: "global", label: "Global" },
  { key: "improve", label: "À améliorer" },
  { key: "strengths", label: "Forces" },
  { key: "examples", label: "Exemples" },
];

const levels: CEFRLevel[] = ["A1", "A2", "B1", "B1+", "B2", "B2+", "C1", "C1+", "C2"];

const cProbeQuestions: CProbe[] = [
  {
    title: "Argumentation stratégique",
    prompt:
      "Vous recommandez une approche, mais un cadre supérieur n'est pas convaincu. Comment défendriez-vous votre recommandation tout en reconnaissant les risques?",
    focus: "argumentation nuancée, gestion des objections, registre professionnel élevé",
  },
  {
    title: "Diplomatie et désaccord",
    prompt:
      "Comment formuleriez-vous un désaccord important avec un partenaire ou un client sans nuire à la relation professionnelle?",
    focus: "diplomatie, souplesse, reformulation, atténuation",
  },
  {
    title: "Abstraction et principes",
    prompt:
      "Quels principes devraient guider une décision lorsque les objectifs opérationnels et les contraintes éthiques entrent en tension?",
    focus: "abstraction, hiérarchisation des idées, précision conceptuelle",
  },
  {
    title: "Registre exécutif",
    prompt:
      "Reformulez votre recommandation pour un comité de direction qui dispose de peu de temps et qui veut comprendre les enjeux essentiels.",
    focus: "synthèse, registre, vocabulaire spécialisé, clarté sous contrainte",
  },
  {
    title: "Nuance et limites",
    prompt:
      "Dans quelles circonstances votre recommandation ne serait-elle pas appropriée? Expliquez les limites et les conditions de succès.",
    focus: "nuance, concession, raisonnement hypothétique contrôlé",
  },
];

const levelValues: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  "B1+": 3.5,
  B2: 4,
  "B2+": 4.5,
  C1: 5,
  "C1+": 5.5,
  C2: 6,
};

const criteria: { key: CriterionKey; label: string }[] = [
  { key: "fluency", label: "Fluidité et spontanéité" },
  { key: "interaction", label: "Stratégies d'interaction" },
  { key: "grammar", label: "Exactitude grammaticale" },
  { key: "vocabulary", label: "Étendue et pertinence du vocabulaire" },
  { key: "coherence", label: "Cohérence et cohésion" },
  { key: "pronunciation", label: "Prononciation / intelligibilité" },
];

const descriptors: Record<string, Record<CEFRLevel, string>> = {
  fluency: {
    A1: "Peut produire des mots, expressions mémorisées ou phrases très courtes. Les pauses sont très fréquentes.",
    A2: "Le discours est lent, fragmenté et dépend de pauses fréquentes.",
    B1: "Peut parler de sujets familiers avec certaines hésitations. La communication demeure possible.",
    "B1+": "Peut maintenir le discours sur des sujets professionnels familiers, mais les pauses et reformulations sont fréquentes.",
    B2: "Peut parler à un rythme raisonnable, expliquer ses idées et maintenir l'interaction avec quelques hésitations.",
    "B2+": "Peut parler avec aisance sur la plupart des sujets professionnels, avec quelques hésitations dans les situations complexes.",
    C1: "Peut s'exprimer avec fluidité et spontanéité, avec peu de recherche visible des mots.",
    "C1+": "Le discours est très fluide et contrôlé, même sur des sujets complexes.",
    C2: "Le discours est naturel, sans effort apparent et très précis sur des sujets complexes ou abstraits.",
  },
  interaction: {
    A1: "Peut répondre à des questions très simples avec beaucoup de soutien; l'échange autonome est très limité.",
    A2: "Peut répondre à des questions simples, mais a de la difficulté à maintenir un échange.",
    B1: "Peut participer à des échanges familiers et demander des clarifications au besoin.",
    "B1+": "Peut maintenir l'interaction sur des sujets professionnels familiers, mais les imprévus peuvent poser problème.",
    B2: "Peut répondre aux questions de relance, clarifier, reformuler et maintenir une interaction professionnelle.",
    "B2+": "Peut gérer des échanges complexes avec un bon contrôle et adapter efficacement ses réponses.",
    C1: "Peut interagir avec souplesse et efficacité en s'adaptant à l'interlocuteur et au contexte.",
    "C1+": "Peut gérer des échanges nuancés et garder le contrôle même sous pression.",
    C2: "Peut interagir avec aisance, précision et nuance dans presque tous les contextes.",
  },
  grammar: {
    A1: "Contrôle très limité de structures simples; erreurs très fréquentes même dans les phrases courtes.",
    A2: "Erreurs de base fréquentes; le message peut demander une interprétation.",
    B1: "Les structures de base sont généralement compréhensibles, mais les erreurs sont fréquentes dans les formes complexes.",
    "B1+": "Bon contrôle des structures courantes; des erreurs persistent avec les accords, les temps verbaux et les phrases complexes.",
    B2: "Contrôle grammatical généralement bon. Les erreurs surviennent, mais obscurcissent rarement le sens.",
    "B2+": "Bon contrôle des structures complexes, avec quelques imprécisions occasionnelles.",
    C1: "Haut degré d'exactitude grammaticale; les erreurs sont rares et mineures.",
    "C1+": "Très bon contrôle, y compris des structures complexes et nuancées.",
    C2: "Contrôle grammatical constamment exact, souple et précis.",
  },
  vocabulary: {
    A1: "Répertoire très limité de mots et expressions de base pour des besoins immédiats.",
    A2: "Vocabulaire limité pour des situations simples et familières.",
    B1: "Vocabulaire suffisant pour des sujets professionnels familiers, mais précision limitée.",
    "B1+": "Vocabulaire professionnel adéquat, avec certaines lacunes et périphrases.",
    B2: "Bonne gamme de vocabulaire professionnel; peut exprimer des opinions, explications et recommandations.",
    "B2+": "Vocabulaire large et précis pour la plupart des contextes professionnels.",
    C1: "Vocabulaire étendu, expression précise et bon contrôle du registre.",
    "C1+": "Vocabulaire très précis, nuancé et flexible.",
    C2: "Étendue lexicale exceptionnelle et précision idiomatique.",
  },
  coherence: {
    A1: "Réponses isolées, très courtes, avec peu ou pas de liens entre les idées.",
    A2: "Les idées sont simples et faiblement reliées.",
    B1: "Peut organiser des explications de base à l'aide de connecteurs simples.",
    "B1+": "Peut structurer une réponse, mais l'organisation peut devenir inégale dans les réponses longues.",
    B2: "Les idées sont claires, structurées et reliées de façon logique.",
    "B2+": "Les arguments sont bien développés avec des transitions efficaces.",
    C1: "Le discours est bien organisé, cohérent et facile à suivre, même dans les explications complexes.",
    "C1+": "Discours très cohérent, nuancé et organisé de façon stratégique.",
    C2: "Discours pleinement cohérent, sophistiqué et maîtrisé.",
  },
  pronunciation: {
    A1: "Compréhensible seulement par moments; l'interlocuteur doit souvent aider ou faire répéter.",
    A2: "Compréhensible avec effort; la prononciation peut nuire à la communication.",
    B1: "Généralement compréhensible, même si la prononciation ou le rythme peuvent parfois nuire.",
    "B1+": "Prononciation généralement claire, avec quelques interférences occasionnelles.",
    B2: "Prononciation claire et intelligible; l'accent mineur ne nuit pas à la communication.",
    "B2+": "Prononciation et rythme très clairs, avec un bon contrôle.",
    C1: "Prononciation naturelle, claire et efficace.",
    "C1+": "Prononciation et intonation très maîtrisées.",
    C2: "Prononciation et prosodie presque natives ou entièrement naturelles.",
  },
};

const reportTemplates: Record<CEFRLevel, string> = {
  A1: "La personne candidate démontre un profil de grand débutant en interaction orale en français. Elle peut répondre à quelques questions très simples avec un soutien important, mais l'échange autonome demeure très limité. Les réponses sont souvent constituées de mots isolés, d'expressions mémorisées ou de phrases très courtes. Les erreurs de grammaire, de vocabulaire, de prononciation et de compréhension limitent fortement la communication professionnelle.",
  A2: "La personne candidate peut gérer des échanges oraux très simples et familiers en français, avec soutien. Elle peut répondre à des questions directes et fournir quelques informations de base, mais l'interaction demeure limitée lorsque les questions demandent une explication, une justification ou une adaptation spontanée. La performance doit être interprétée avec prudence si les preuves observées sont limitées.",
  B1: "La personne candidate peut communiquer en français sur des sujets professionnels familiers et fournir des explications de base. L'interaction est généralement possible, même si les réponses peuvent nécessiter du soutien, des reformulations ou des relances supplémentaires. Les erreurs de grammaire, de vocabulaire et de structure demeurent fréquentes, surtout lorsque la personne tente des explications plus complexes.",
  "B1+": "La personne candidate démontre une capacité fonctionnelle à communiquer en français dans des contextes professionnels familiers. Elle peut expliquer des situations, fournir une justification de base et répondre à des questions de relance, mais la performance n'est pas encore stable au niveau B2. La fluidité, l'exactitude grammaticale et la précision lexicale demeurent inégales lorsque les tâches deviennent plus complexes.",
  B2: "La personne candidate démontre une capacité efficace à communiquer oralement en français dans un contexte professionnel. Elle peut expliquer des processus, comparer des options, justifier des recommandations et répondre à des questions de relance avec une fluidité et une clarté raisonnables. Certaines erreurs peuvent survenir, mais elles ne nuisent généralement pas à la communication.",
  "B2+": "La personne candidate démontre un profil oral B2 solide et s'approche du C1 dans certains aspects. Elle peut traiter des sujets professionnels avec une bonne fluidité, une bonne structure et une bonne interaction. Certaines limites demeurent dans la précision, la nuance ou le contrôle soutenu lorsque le sujet devient plus complexe ou abstrait.",
  C1: "La personne candidate démontre des compétences avancées en interaction orale en français. Elle peut communiquer avec fluidité et spontanéité, structurer clairement des idées complexes, justifier des recommandations et adapter sa langue à un contexte professionnel. Les erreurs sont occasionnelles et généralement mineures.",
  "C1+": "La personne candidate démontre un profil oral avancé très solide. Elle peut traiter des sujets professionnels et abstraits complexes avec précision, nuance et souplesse. La communication est très efficace, avec seulement quelques limites mineures qui empêchent l'attribution d'un niveau C2 complet.",
  C2: "La personne candidate démontre une maîtrise exceptionnelle du français oral dans des contextes professionnels et complexes. Elle peut exprimer des distinctions subtiles, reformuler naturellement, interagir avec aisance et maintenir l'exactitude, la nuance et la précision dans l'ensemble des tâches. Ce niveau devrait être attribué seulement lorsque la performance est constamment exceptionnelle.",
};

const levelProfileLines: Record<CEFRLevel, string> = {
  A1: "Profil de grand débutant : la priorité du rapport est de documenter le soutien requis, la compréhension limitée et la capacité à répondre à des questions très simples.",
  A2: "Profil élémentaire : le rapport doit souligner les échanges simples possibles, mais aussi la dépendance aux questions directes, aux reformulations et au contexte familier.",
  B1: "Profil intermédiaire fonctionnel : le rapport doit distinguer la communication possible sur sujets familiers des limites en précision, spontanéité et développement.",
  "B1+": "Profil intermédiaire en consolidation : le rapport doit montrer une capacité fonctionnelle, mais encore instable lorsque la tâche exige justification, comparaison ou adaptation.",
  B2: "Profil autonome : le rapport doit mettre l'accent sur la capacité à expliquer, comparer, justifier et maintenir une interaction professionnelle claire.",
  "B2+": "Profil autonome solide : le rapport doit reconnaître une performance généralement efficace, avec quelques limites de nuance, de précision ou de stabilité.",
  C1: "Profil avancé : le rapport doit refléter la fluidité, la précision, l'adaptation au contexte et la capacité à traiter des idées complexes.",
  "C1+": "Profil avancé très solide : le rapport doit souligner la nuance, la souplesse et la précision soutenue, tout en expliquant pourquoi C2 n'est pas confirmé.",
  C2: "Profil maîtrise : le rapport doit réserver ce niveau à une performance constamment exceptionnelle, naturelle, précise et nuancée.",
};

const judgmentPhraseTemplates: Record<"emerging" | "functional" | "autonomous" | "advanced", JudgmentPhrase[]> = {
  emerging: [
    {
      id: "emerging-conclusion",
      category: "Conclusion",
      title: "Profil débutant",
      text: "La performance observée correspond à un profil débutant en interaction orale. La personne candidate peut répondre à certaines questions simples, mais l'échange demeure fortement dépendant du soutien de l'interlocuteur.",
    },
    {
      id: "emerging-professional",
      category: "Contexte professionnel",
      title: "Portée professionnelle limitée",
      text: "Dans un contexte professionnel, la communication est possible seulement pour des besoins immédiats, des informations très familières et des questions directes.",
    },
  ],
  functional: [
    {
      id: "functional-conclusion",
      category: "Conclusion",
      title: "Communication fonctionnelle",
      text: "La personne candidate peut communiquer de façon fonctionnelle sur des sujets professionnels familiers. Les idées principales sont généralement compréhensibles, même si la performance demeure inégale selon la complexité de la tâche.",
    },
    {
      id: "functional-professional",
      category: "Contexte professionnel",
      title: "Autonomie partielle",
      text: "En contexte professionnel, la personne candidate peut participer à des échanges prévisibles, expliquer des situations simples et fournir une justification de base, avec un soutien ponctuel ou des relances.",
    },
  ],
  autonomous: [
    {
      id: "autonomous-conclusion",
      category: "Conclusion",
      title: "Communication autonome",
      text: "La personne candidate démontre une capacité autonome à communiquer oralement en français dans un contexte professionnel. Elle peut expliquer, comparer, justifier et répondre à des questions de relance avec une clarté généralement suffisante.",
    },
    {
      id: "autonomous-professional",
      category: "Contexte professionnel",
      title: "Tâches professionnelles",
      text: "La performance permet de soutenir des interactions professionnelles courantes, y compris l'explication d'un processus, la comparaison d'options et la formulation d'une recommandation.",
    },
  ],
  advanced: [
    {
      id: "advanced-conclusion",
      category: "Conclusion",
      title: "Profil avancé",
      text: "La personne candidate démontre une compétence avancée en interaction orale. Elle communique avec fluidité, précision et souplesse, tout en adaptant son discours au contexte professionnel.",
    },
    {
      id: "advanced-professional",
      category: "Contexte professionnel",
      title: "Communication complexe",
      text: "La performance permet de traiter des sujets professionnels complexes, de nuancer les recommandations et de maintenir une interaction efficace dans des situations moins prévisibles.",
    },
  ],
};

const cefrJudgmentPhraseTemplates: Record<CEFRLevel, JudgmentPhrase[]> = {
  A1: [
    {
      id: "cefr-a1-conclusion",
      category: "Conclusion",
      title: "A1 - Grand débutant",
      text: "La performance observée correspond à un profil A1 en interaction orale. La personne candidate peut répondre à quelques questions très simples avec un soutien important, mais l'échange autonome demeure très limité.",
    },
    {
      id: "cefr-a1-professional",
      category: "Contexte professionnel",
      title: "Communication très limitée",
      text: "En contexte professionnel, les réponses sont souvent constituées de mots isolés, d'expressions mémorisées ou de phrases très courtes. Les erreurs et la compréhension limitée restreignent fortement la communication.",
    },
  ],
  A2: [
    {
      id: "cefr-a2-conclusion",
      category: "Conclusion",
      title: "A2 - Élémentaire",
      text: "La performance observée correspond à un profil A2. La personne candidate peut gérer des échanges oraux très simples et familiers avec soutien, surtout lorsque les questions sont directes et concrètes.",
    },
    {
      id: "cefr-a2-professional",
      category: "Contexte professionnel",
      title: "Besoins immédiats",
      text: "La communication professionnelle demeure limitée aux informations de base, aux tâches familières et aux besoins immédiats. Les explications, justifications et relances spontanées exigent encore beaucoup de soutien.",
    },
  ],
  B1: [
    {
      id: "cefr-b1-conclusion",
      category: "Conclusion",
      title: "B1 - Fonctionnel limité",
      text: "La performance observée correspond à un profil B1. La personne candidate peut communiquer sur des sujets professionnels familiers et fournir des explications de base, mais les réponses demeurent souvent simples et nécessitent parfois des relances.",
    },
    {
      id: "cefr-b1-professional",
      category: "Contexte professionnel",
      title: "Sujets familiers",
      text: "L'interaction est généralement possible lorsque le contexte est familier. Les limites apparaissent davantage lorsque la tâche exige précision, développement, comparaison ou adaptation spontanée.",
    },
  ],
  "B1+": [
    {
      id: "cefr-b1-plus-conclusion",
      category: "Conclusion",
      title: "B1+ - En consolidation",
      text: "La performance observée correspond à un profil B1+. La personne candidate démontre une capacité fonctionnelle en français dans des contextes professionnels familiers, mais la performance n'est pas encore stable au niveau B2.",
    },
    {
      id: "cefr-b1-plus-nuance",
      category: "Nuance",
      title: "Fonctionnel mais instable",
      text: "La personne candidate peut expliquer des situations et fournir une justification de base, mais la fluidité, la précision lexicale ou grammaticale et le développement des idées demeurent inégaux lorsque la tâche devient plus complexe.",
    },
  ],
  B2: [
    {
      id: "cefr-b2-conclusion",
      category: "Conclusion",
      title: "B2 - Autonome",
      text: "La performance observée correspond à un profil B2. La personne candidate peut communiquer efficacement dans un contexte professionnel, expliquer des processus, comparer des options et justifier des recommandations avec une clarté raisonnable.",
    },
    {
      id: "cefr-b2-professional",
      category: "Contexte professionnel",
      title: "Interaction professionnelle claire",
      text: "La communication est généralement autonome et fonctionnelle. Certaines erreurs peuvent survenir, mais elles ne nuisent généralement pas à la compréhension ou au maintien de l'interaction.",
    },
  ],
  "B2+": [
    {
      id: "cefr-b2-plus-conclusion",
      category: "Conclusion",
      title: "B2+ - Autonome solide",
      text: "La performance observée correspond à un profil B2+. La personne candidate démontre une communication généralement efficace et structurée, avec une bonne capacité à développer, comparer et justifier dans des situations professionnelles.",
    },
    {
      id: "cefr-b2-plus-nuance",
      category: "Nuance",
      title: "Proche du C1",
      text: "Le profil s'approche du C1 dans certains aspects, mais certaines limites demeurent dans la nuance, la précision soutenue ou la stabilité lorsque les sujets deviennent plus complexes ou abstraits.",
    },
  ],
  C1: [
    {
      id: "cefr-c1-conclusion",
      category: "Conclusion",
      title: "C1 - Avancé",
      text: "La performance observée correspond à un profil C1. La personne candidate communique avec fluidité et spontanéité, structure clairement des idées complexes et adapte généralement son discours au contexte professionnel.",
    },
    {
      id: "cefr-c1-professional",
      category: "Contexte professionnel",
      title: "Idées complexes",
      text: "La personne candidate peut traiter des sujets professionnels complexes, justifier des recommandations, nuancer ses propos et répondre efficacement aux questions de suivi.",
    },
  ],
  "C1+": [
    {
      id: "cefr-c1-plus-conclusion",
      category: "Conclusion",
      title: "C1+ - Avancé très solide",
      text: "La performance observée correspond à un profil C1+ très solide. La personne candidate traite des sujets professionnels et abstraits avec précision, nuance et souplesse, tout en maintenant une interaction très efficace.",
    },
    {
      id: "cefr-c1-plus-nuance",
      category: "Nuance",
      title: "C2 non confirmé",
      text: "Malgré une performance avancée très solide, le niveau C2 n'est confirmé que si la maîtrise est constamment exceptionnelle, naturelle, précise et nuancée dans l'ensemble des tâches.",
    },
  ],
  C2: [
    {
      id: "cefr-c2-conclusion",
      category: "Conclusion",
      title: "C2 - Maîtrise",
      text: "La performance observée correspond à un profil C2. La personne candidate démontre une maîtrise exceptionnelle du français oral dans des contextes professionnels, complexes et abstraits.",
    },
    {
      id: "cefr-c2-professional",
      category: "Contexte professionnel",
      title: "Performance exceptionnelle",
      text: "La personne candidate exprime des distinctions subtiles, reformule naturellement, interagit avec aisance et maintient l'exactitude, la nuance et la précision de façon constante. Ce niveau doit rester réservé à une performance constamment exceptionnelle.",
    },
  ],
};

const pfl2JudgmentPhraseTemplates: Record<SLELevel, JudgmentPhrase[]> = {
  "A-": [
    {
      id: "pfl2-a-minus-conclusion",
      category: "Conclusion",
      title: "A- - Pré-OF01",
      text: "La performance observée correspond à un profil A- en interaction orale, soit un profil pré-OF01 / très grand débutant. La personne candidate dispose de très peu de français fonctionnel et ne peut pas encore soutenir un échange oral simple de façon autonome.",
    },
    {
      id: "pfl2-a-minus-professional",
      category: "Contexte professionnel",
      title: "Autonomie très limitée",
      text: "En contexte professionnel, la communication reste limitée à quelques mots isolés, expressions mémorisées ou réponses très courtes, avec un soutien important de l'interlocuteur.",
    },
  ],
  A: [
    {
      id: "pfl2-a-conclusion",
      category: "Conclusion",
      title: "A - OF01-OF12",
      text: "La performance observée correspond à un profil A, approximativement dans la zone OF01-OF12 du curriculum PFL2. La personne candidate peut répondre à des questions très simples et donner des informations personnelles ou professionnelles de base avec soutien.",
    },
    {
      id: "pfl2-a-professional",
      category: "Contexte professionnel",
      title: "Échanges très simples",
      text: "La communication professionnelle est possible seulement dans des situations très familières, avec des phrases courtes, des questions directes et des relances fréquentes.",
    },
  ],
  "A+": [
    {
      id: "pfl2-a-plus-conclusion",
      category: "Conclusion",
      title: "A+ - OF13-OF40 / pré-B",
      text: "La performance observée correspond à un profil A+, approximativement dans la zone OF13-OF40 / pré-B. La personne candidate progresse vers les fonctions nécessaires au niveau B, mais n'est pas encore un B fonctionnel stable.",
    },
    {
      id: "pfl2-a-plus-prudence",
      category: "Prudence",
      title: "OF40 n'est pas B",
      text: "Même lorsque certaines fonctions de préparation au B apparaissent, OF40 doit être interprété comme A+ / pré-B et non comme B-, B ou B+. Le niveau B exige une performance fonctionnelle plus stable.",
    },
  ],
  "B-": [
    {
      id: "pfl2-b-minus-conclusion",
      category: "Conclusion",
      title: "B- - Proche B instable",
      text: "La performance observée correspond à un profil B-. La personne candidate démontre plusieurs comportements associés au niveau B, mais la performance n'est pas encore suffisamment stable pour confirmer un B fonctionnel.",
    },
    {
      id: "pfl2-b-minus-prudence",
      category: "Prudence",
      title: "Stabilité à confirmer",
      text: "La fluidité, la précision, le vocabulaire ou l'autonomie restent irréguliers lorsque la personne candidate doit développer ses idées, justifier ou répondre à des relances moins prévisibles.",
    },
  ],
  B: [
    {
      id: "pfl2-b-conclusion",
      category: "Conclusion",
      title: "B - Fonctionnel",
      text: "La performance observée correspond à un niveau B fonctionnel. La personne candidate peut communiquer en français dans des situations professionnelles familières, décrire, expliquer, raconter des événements passés, comparer des options simples et justifier une opinion de base.",
    },
    {
      id: "pfl2-b-professional",
      category: "Contexte professionnel",
      title: "Communication professionnelle familière",
      text: "Les erreurs sont présentes, mais elles ne bloquent généralement pas la communication lorsque les sujets demeurent familiers et que la tâche reste fonctionnelle.",
    },
  ],
  "B+": [
    {
      id: "pfl2-b-plus-conclusion",
      category: "Conclusion",
      title: "B+ - B solide",
      text: "La performance observée correspond à un profil B+ : un B très solide avec certaines habiletés émergentes du niveau C. La personne candidate peut organiser ses idées, justifier des recommandations et répondre à des relances avec une autonomie croissante.",
    },
    {
      id: "pfl2-b-plus-nuance",
      category: "Nuance",
      title: "Transition vers C",
      text: "Le profil n'est pas encore stable au niveau C lorsque les discussions deviennent abstraites, nuancées ou moins prévisibles; ces limites doivent être précisées dans l'évaluation finale.",
    },
  ],
  "C-": [
    {
      id: "pfl2-c-minus-conclusion",
      category: "Conclusion",
      title: "C- - Proche C instable",
      text: "La performance observée correspond à un profil C-. La personne candidate approche le niveau C et peut traiter des sujets plus complexes, mais la performance demeure instable dans la nuance, la précision, la spontanéité ou la structure.",
    },
    {
      id: "pfl2-c-minus-prudence",
      category: "Prudence",
      title: "C non confirmé",
      text: "Le niveau C ne devrait pas être confirmé si les réponses complexes ou abstraites restent irrégulières, peu nuancées ou trop dépendantes des relances de l'évaluateur.",
    },
  ],
  C: [
    {
      id: "pfl2-c-conclusion",
      category: "Conclusion",
      title: "C - Fonctionnel",
      text: "La performance observée correspond à un niveau C fonctionnel. La personne candidate communique efficacement et avec autonomie dans une grande variété de situations professionnelles, y compris des questions hypothétiques, abstraites ou complexes.",
    },
    {
      id: "pfl2-c-professional",
      category: "Contexte professionnel",
      title: "Discussion complexe",
      text: "La personne candidate peut expliquer, comparer, justifier, formuler des hypothèses, discuter d'enjeux abstraits et répondre spontanément aux questions de suivi.",
    },
  ],
  "C+": [
    {
      id: "pfl2-c-plus-conclusion",
      category: "Conclusion",
      title: "C+ - Avancé",
      text: "La performance observée correspond à un profil C+ : un C solide / avancé. La personne candidate dépasse le niveau C attendu par son aisance, sa précision, sa nuance et son autonomie dans des contextes professionnels et abstraits.",
    },
    {
      id: "pfl2-c-plus-professional",
      category: "Contexte professionnel",
      title: "Communication avancée stable",
      text: "Les erreurs sont rares et ne nuisent pas à l'efficacité de la communication. La personne candidate maintient un discours précis, souple et nuancé même dans les tâches complexes.",
    },
  ],
};

const recommendationTemplates: Record<string, string[]> = {
  "A1/A2": [
    "Développer les bases de l'interaction orale : se présenter, répondre à des questions simples et demander de répéter.",
    "Renforcer le vocabulaire essentiel lié au poste, aux tâches courantes et aux besoins immédiats.",
    "Pratiquer des phrases courtes pour décrire son rôle, ses responsabilités et des actions simples.",
    "Travailler la compréhension de questions simples et les réponses spontanées très guidées.",
  ],
  "B1/B1+": [
    "Poursuivre la pratique orale axée sur l'explication claire de processus et l'utilisation de connecteurs de séquence.",
    "Renforcer l'exactitude grammaticale, surtout les temps verbaux, les accords et la structure de phrase.",
    "Développer le vocabulaire professionnel lié aux recommandations, aux risques, aux échéances et à la prise de décision.",
    "S'exercer à répondre à des questions de relance spontanées.",
  ],
  "B2/B2+": [
    "Poursuivre la pratique avec des scénarios professionnels complexes.",
    "Renforcer la précision et la nuance dans la justification des recommandations.",
    "Élargir le vocabulaire pour les sujets abstraits et stratégiques.",
    "Pratiquer des réponses soutenues avec moins d'hésitations et des structures plus complexes.",
  ],
  "C1/C1+": [
    "Maintenir une pratique orale avancée au moyen de discussions professionnelles complexes.",
    "Raffiner la nuance, l'expression idiomatique et le registre.",
    "Pratiquer l'argumentation de haut niveau, la diplomatie et la communication de niveau exécutif.",
  ],
  C2: [
    "Aucune formation linguistique fondamentale n'est requise.",
    "Maintenir le français professionnel avancé au moyen de discussions de haut niveau, de vocabulaire spécialisé et de tâches de communication nuancées.",
  ],
};

const deepeningFollowUps = [
  "Pouvez-vous donner un exemple concret ?",
  "Pourquoi pensez-vous que cette solution serait efficace ?",
  "Que feriez-vous si votre gestionnaire n'était pas d'accord ?",
  "Comment expliqueriez-vous cela à un collègue moins familier avec le dossier ?",
  "Quels seraient les risques à long terme ?",
  "Comment adapteriez-vous votre message selon votre public ?",
  "Pouvez-vous reformuler votre idée autrement ?",
  "Quelles autres options seraient possibles ?",
  "Quel serait l'impact sur les délais, les ressources ou la qualité du travail ?",
  "Comment évalueriez-vous le succès de votre solution ?",
];

const stages: Stage[] = [
  {
    id: "warm-up",
    label: "Étape 1",
    title: "Mise en confiance",
    time: "3-4 min",
    purpose: [
      "mettre la personne candidate à l'aise",
      "confirmer l'aisance orale générale",
      "observer la communication spontanée de base",
      "introduire le contexte professionnel",
    ],
    main: [
      "Pouvez-vous vous présenter brièvement et décrire votre rôle actuel ?",
      "Quelles sont vos principales responsabilités au travail ?",
      "Dans quelles situations utilisez-vous le français au travail ?",
      "Pouvez-vous décrire une journée typique dans votre poste ?",
    ],
    easier: [
      "Où travaillez-vous actuellement ?",
      "Depuis combien de temps occupez-vous votre poste ?",
      "Quelles tâches faites-vous le plus souvent ?",
    ],
    advanced: [
      "Comment votre rôle a-t-il évolué au cours des dernières années ?",
      "Quels aspects de votre travail exigent le plus de communication ?",
      "Comment adaptez-vous votre communication selon votre interlocuteur ?",
    ],
    focus: [
      "capacité à se présenter et à décrire son rôle",
      "fluidité",
      "vocabulaire lié au travail",
      "capacité à répondre sans relances excessives",
    ],
  },
  {
    id: "process",
    label: "Étape 2",
    title: "Expliquer un processus",
    time: "5-7 min",
    purpose: [
      "évaluer la capacité à organiser l'information",
      "enchaîner les actions de façon logique",
      "expliquer un processus professionnel familier",
      "utiliser des connecteurs",
      "maintenir la clarté",
    ],
    main: [
      "Expliquez, étape par étape, comment vous préparez un dossier, un rapport ou une note pour votre gestionnaire.",
      "Décrivez le processus que vous suivez lorsqu'un nouveau projet commence.",
      "Expliquez comment vous organisez vos priorités lorsqu'il y a plusieurs échéances.",
      "Décrivez comment vous traitez une demande urgente au travail.",
    ],
    followUps: [
      "Quelles sont les premières étapes ?",
      "Qui doit être consulté ?",
      "Quels documents ou renseignements sont nécessaires ?",
      "Comment vérifiez-vous que le travail est complet ?",
      "Que faites-vous si des informations sont manquantes ?",
      "Comment communiquez-vous les résultats ?",
    ],
    deepening: deepeningFollowUps,
    easier: [
      "Décrivez une tâche que vous faites régulièrement.",
      "Quelles sont les étapes principales ?",
      "Que faites-vous en premier ? Ensuite ?",
    ],
    advanced: [
      "Comment ce processus pourrait-il être amélioré ?",
      "Quels risques peuvent survenir dans ce processus ?",
      "Comment adapteriez-vous ce processus dans un contexte plus urgent ?",
      "Comment expliqueriez-vous ce processus à une personne qui ne connaît pas votre domaine ?",
    ],
    focus: [
      "séquence : d'abord, ensuite, puis, enfin",
      "clarté",
      "précision",
      "capacité à expliquer la cause et la conséquence",
      "contrôle grammatical",
      "vocabulaire professionnel",
    ],
  },
  {
    id: "compare",
    label: "Étape 3",
    title: "Comparer des options et justifier une recommandation",
    time: "5-7 min",
    purpose: [
      "évaluer la capacité à comparer",
      "justifier un choix",
      "exprimer une opinion",
      "appuyer une recommandation",
      "répondre aux demandes de clarification",
    ],
    main: [
      "Votre gestionnaire vous demande de recommander une stratégie pour améliorer la collaboration avec un partenaire externe ou international. Présentez deux options, comparez-les et justifiez votre recommandation.",
    ],
    alternatives: [
      "Vous devez recommander entre une réunion virtuelle et une réunion en personne. Comparez les deux options.",
      "Votre équipe hésite entre prolonger une échéance ou ajouter temporairement des ressources. Quelle option recommandez-vous ?",
      "Vous devez choisir entre envoyer une note écrite détaillée ou organiser une brève présentation orale. Que recommandez-vous ?",
      "Votre gestionnaire veut améliorer la communication dans l'équipe. Proposez deux solutions et recommandez la meilleure.",
    ],
    followUps: [
      "Quels sont les avantages de chaque option ?",
      "Quels sont les risques ?",
      "Quelle option est la plus réaliste ?",
      "Comment justifiez-vous votre choix ?",
      "Quel serait l'impact sur l'équipe ?",
      "Que diriez-vous à une personne qui n'est pas d'accord ?",
    ],
    deepening: deepeningFollowUps,
    easier: [
      "Quelle option préférez-vous ? Pourquoi ?",
      "Quels sont les avantages ?",
      "Quels sont les désavantages ?",
    ],
    advanced: [
      "Comment votre recommandation changerait-elle si les délais étaient très courts ?",
      "Comment tiendriez-vous compte des contraintes budgétaires ?",
      "Comment présenteriez-vous cette recommandation à la haute direction ?",
      "Quels compromis seraient nécessaires ?",
    ],
    focus: [
      "capacité à comparer",
      "utilisation du contraste : cependant, toutefois, en revanche, par contre",
      "justification",
      "argumentation",
      "capacité à répondre aux questions de relance",
      "structure et cohérence",
    ],
  },
  {
    id: "problem-solving",
    label: "Étape 4",
    title: "Scénario professionnel de résolution de problème",
    time: "7-8 min",
    purpose: [
      "évaluer l'interaction spontanée",
      "évaluer la résolution de problème",
      "observer la négociation",
      "observer la capacité à clarifier",
      "observer la capacité à proposer des prochaines étapes réalistes",
    ],
    main: [
      "Un partenaire ne peut pas respecter une échéance importante. Vous devez expliquer les conséquences possibles, clarifier la situation et proposer des solutions réalistes.",
      "Expliquez comment vous réagiriez à cette situation. Décrivez les étapes à suivre, les personnes à consulter et les solutions possibles.",
    ],
    alternatives: [
      "Un document important contient des erreurs et doit être corrigé rapidement.",
      "Un client interne demande une réponse urgente, mais l'information n'est pas encore disponible.",
      "Deux équipes ne s'entendent pas sur les prochaines étapes d'un projet.",
      "Une réunion importante doit être reportée à la dernière minute.",
      "Un nouveau processus crée de la confusion dans l'équipe.",
    ],
    followUps: [
      "Quelle information devez-vous obtenir en premier ?",
      "Qui devrait être informé ?",
      "Comment expliqueriez-vous l'impact du retard ?",
      "Quelles solutions proposeriez-vous ?",
      "Comment limiteriez-vous les risques ?",
      "Que feriez-vous si le partenaire ne répondait pas rapidement ?",
      "Comment communiqueriez-vous la situation à votre gestionnaire ?",
    ],
    deepening: deepeningFollowUps,
    easier: [
      "Que feriez-vous en premier ?",
      "Qui contacteriez-vous ?",
      "Comment expliqueriez-vous le problème ?",
    ],
    advanced: [
      "Comment géreriez-vous cette situation si elle avait des implications politiques ou financières ?",
      "Comment rédigeriez-vous un message diplomatique à un partenaire externe ?",
      "Comment présenteriez-vous les risques à la haute direction ?",
      "Comment maintiendriez-vous la relation avec le partenaire malgré le problème ?",
    ],
    focus: [
      "interaction spontanée",
      "capacité à clarifier et à reformuler",
      "capacité à proposer des options réalistes",
      "ton diplomatique",
      "précision",
      "capacité à gérer la complexité",
    ],
  },
  {
    id: "final",
    label: "Étape 5",
    title: "Évaluation finale",
    time: "2-3 min",
    purpose: [
      "confirmer le niveau CECR/CEFR final",
      "réviser les cotes par critère et les preuves observées",
      "préparer un résumé prêt pour le rapport",
    ],
    main: [
      "Vérifier si le niveau suggéré correspond à la performance observée en direct.",
      "Confirmer que le niveau final repose sur la performance orale observée, et non sur une conversion mécanique depuis un autre cadre.",
      "Générer le résumé CECR/CEFR et modifier le texte avant de le copier dans le rapport CCC.",
    ],
    focus: [
      "niveau final confirmé par l'évaluateur ou l'évaluatrice",
      "cotes par critère cohérentes entre elles",
      "notes fondées sur des preuves, pas seulement sur des impressions",
      "résumé prêt pour le rapport CCC",
    ],
  },
];

const quickTagGroups: QuickTagGroup[] = [
  {
    title: "Observations générales",
    description: "Profil global à réutiliser dans le rapport CCC.",
    target: "generalObservations",
    prefix: "observation générale",
    tone: "neutral",
    view: "global",
    tags: [
      "mots isolés",
      "phrases mémorisées",
      "réponses non autonomes",
      "communication fonctionnelle",
      "bonne autonomie dans l'échange",
      "autonomie partielle",
      "performance inégale selon la tâche",
      "réponses très courtes",
      "soutien fréquent requis",
      "répond mieux aux questions concrètes",
      "difficulté avec les questions abstraites",
      "compréhension généralement adéquate",
      "compréhension limitée sans reformulation",
      "aisance plus forte sur sujets familiers",
      "rythme lent mais compréhensible",
      "communication difficile sans aide",
    ],
  },
  {
    title: "Grammaire - points à améliorer",
    description: "À utiliser pour noter ce qui est faible, instable ou absent.",
    target: "preciseErrors",
    prefix: "grammaire à améliorer",
    tone: "challenge",
    view: "improve",
    tags: [
      "temps verbaux instables",
      "passé non maîtrisé",
      "conditionnel absent ou incorrect",
      "accords fréquents à corriger",
      "genre / nombre instables",
      "pronoms difficiles à utiliser",
      "prépositions imprécises",
      "structure de phrase fragile",
      "ordre des mots influencé par l'anglais",
    ],
  },
  {
    title: "Vocabulaire - points à améliorer",
    description: "À utiliser pour noter un manque de mots, de précision ou de registre.",
    target: "preciseErrors",
    prefix: "vocabulaire à améliorer",
    tone: "challenge",
    view: "improve",
    tags: [
      "vocabulaire limité",
      "vocabulaire imprécis",
      "anglicismes fréquents",
      "choix de mots inadéquats",
      "répétitions nombreuses",
      "manque de terminologie professionnelle",
      "cherche souvent ses mots",
    ],
  },
  {
    title: "Discours - points à améliorer",
    description: "À utiliser pour les difficultés d'organisation, d'explication ou de justification.",
    target: "challenges",
    prefix: "discours",
    tone: "challenge",
    view: "improve",
    tags: [
      "organisation peu claire",
      "connecteurs limités",
      "explication incomplète",
      "explication simple mais inégale",
      "justification faible",
      "justification de base",
      "difficulté à comparer des options",
      "difficulté à donner des exemples",
    ],
  },
  {
    title: "Interaction - points à améliorer",
    description: "À utiliser pour les difficultés à maintenir l'échange en direct.",
    target: "challenges",
    prefix: "interaction",
    tone: "challenge",
    view: "improve",
    tags: [
      "besoin de relances fréquentes",
      "spontanéité limitée",
      "difficulté à répondre aux relances",
      "difficulté à reformuler",
      "passe à l'anglais",
      "demande souvent de répéter",
    ],
  },
  {
    title: "Prononciation / intelligibilité - points à améliorer",
    description: "À utiliser lorsque la prononciation, le rythme ou l'articulation nuisent à l'intelligibilité.",
    target: "preciseErrors",
    prefix: "prononciation à améliorer",
    tone: "challenge",
    view: "improve",
    tags: [
      "prononciation nuit à la compréhension",
      "mots difficiles à reconnaître",
      "sons français instables",
      "intonation peu naturelle",
      "débit haché",
      "articulation imprécise",
      "répétitions nécessaires à cause de la prononciation",
    ],
  },
  {
    title: "Points forts - grammaire et vocabulaire",
    description: "À utiliser pour les éléments linguistiques solides observés.",
    target: "strengths",
    prefix: "force linguistique",
    tone: "strength",
    view: "strengths",
    tags: [
      "maîtrise des temps du passé",
      "utilisation adéquate du présent",
      "utilisation adéquate du futur",
      "bonne situation spatio-temporelle",
      "accords généralement maîtrisés",
      "phrases complexes bien contrôlées",
      "riche vocabulaire",
      "vocabulaire professionnel précis",
      "bonne reformulation lexicale",
    ],
  },
  {
    title: "Points forts - communication",
    description: "À utiliser pour les forces d'interaction, de clarté et de discours.",
    target: "strengths",
    prefix: "force communicative",
    tone: "strength",
    view: "strengths",
    tags: [
      "structure claire",
      "bonne fluidité",
      "bonne interaction",
      "exemples efficaces",
      "recommandation solide",
      "bonne clarification",
      "ton approprié",
      "bonne cohérence",
    ],
  },
  {
    title: "Points forts - prononciation / intelligibilité",
    description: "À utiliser lorsque la parole demeure claire et facile à comprendre.",
    target: "strengths",
    prefix: "force de prononciation",
    tone: "strength",
    view: "strengths",
    tags: [
      "prononciation généralement claire",
      "intelligibilité constante",
      "rythme naturel",
      "bonne articulation",
      "accent présent mais non gênant",
      "intonation appropriée",
    ],
  },
  {
    title: "Approfondissement C - preuves avancées",
    description: "À utiliser seulement si le candidat montre une performance B2+ ou plus.",
    target: "strengths",
    prefix: "preuve avancée C",
    tone: "strength",
    view: "strengths",
    tags: [
      "argumentation nuancée",
      "nuance soutenue",
      "souplesse discursive",
      "précision soutenue",
      "registre adapté au niveau exécutif",
      "diplomatie sous pression",
      "abstraction maîtrisée",
      "vocabulaire spécialisé précis",
      "maîtrise exceptionnelle",
      "aisance quasi native",
      "nuance constante exceptionnelle",
    ],
  },
  {
    title: "Approfondissement C - limites observées",
    description: "À utiliser si la performance reste forte, mais ne soutient pas clairement C1/C2.",
    target: "challenges",
    prefix: "limite pour le niveau C",
    tone: "challenge",
    view: "improve",
    tags: [
      "nuance limitée pour le niveau C",
      "registre trop simple pour C",
      "difficulté à soutenir une position complexe",
    ],
  },
  {
    title: "Exemples de performance forte",
    description: "Formulations utiles pour illustrer le rapport sans tout rédiger à la main.",
    target: "strongPerformanceExamples",
    prefix: "exemple fort",
    tone: "strength",
    view: "examples",
    tags: [
      "a expliqué clairement un processus",
      "a donné un exemple concret pertinent",
      "a comparé deux options de façon claire",
      "a justifié une recommandation",
      "a reformulé efficacement une idée",
      "a clarifié une réponse après relance",
      "a maintenu un ton professionnel",
      "a organisé sa réponse avec des connecteurs",
      "a décrit une situation passée avec cohérence",
    ],
  },
];

const frequentTagValues = [
  "mots isolés",
  "réponses non autonomes",
  "communication fonctionnelle",
  "autonomie partielle",
  "réponses très courtes",
  "soutien fréquent requis",
  "compréhension limitée sans reformulation",
  "temps verbaux instables",
  "vocabulaire limité",
  "prononciation nuit à la compréhension",
  "cherche souvent ses mots",
  "bonne fluidité",
  "prononciation généralement claire",
  "maîtrise des temps du passé",
  "a justifié une recommandation",
  "nuance soutenue",
  "maîtrise exceptionnelle",
];

const tagLabels: Record<string, string> = {
  "mots isolés": "mots isolés",
  "phrases mémorisées": "mémorisé",
  "réponses non autonomes": "non autonome",
  "communication fonctionnelle": "fonctionnelle",
  "bonne autonomie dans l'échange": "autonomie",
  "autonomie partielle": "autonomie part.",
  "performance inégale selon la tâche": "inégale",
  "réponses très courtes": "réponses courtes",
  "soutien fréquent requis": "soutien requis",
  "répond mieux aux questions concrètes": "concret +",
  "difficulté avec les questions abstraites": "abstrait difficile",
  "compréhension généralement adéquate": "compréhension OK",
  "compréhension limitée sans reformulation": "reformulation requise",
  "aisance plus forte sur sujets familiers": "familier +",
  "rythme lent mais compréhensible": "lent mais clair",
  "communication difficile sans aide": "aide requise",
  "prononciation nuit à la compréhension": "pron. gêne",
  "mots difficiles à reconnaître": "mots peu clairs",
  "sons français instables": "sons instables",
  "intonation peu naturelle": "intonation",
  "débit haché": "débit haché",
  "articulation imprécise": "articulation",
  "répétitions nécessaires à cause de la prononciation": "répéter pron.",
  "temps verbaux instables": "temps instables",
  "passé non maîtrisé": "passé fragile",
  "conditionnel absent ou incorrect": "conditionnel",
  "accords fréquents à corriger": "accords",
  "genre / nombre instables": "genre / nombre",
  "pronoms difficiles à utiliser": "pronoms",
  "prépositions imprécises": "prépositions",
  "structure de phrase fragile": "phrase fragile",
  "ordre des mots influencé par l'anglais": "ordre des mots",
  "vocabulaire limité": "vocab. limité",
  "vocabulaire imprécis": "vocab. imprécis",
  "anglicismes fréquents": "anglicismes",
  "choix de mots inadéquats": "choix de mots",
  "répétitions nombreuses": "répétitions",
  "manque de terminologie professionnelle": "termes pro",
  "cherche souvent ses mots": "cherche mots",
  "organisation peu claire": "organisation",
  "connecteurs limités": "connecteurs",
  "explication incomplète": "explication",
  "explication simple mais inégale": "explication inégale",
  "justification faible": "justification",
  "justification de base": "justification base",
  "difficulté à comparer des options": "comparaison",
  "difficulté à donner des exemples": "exemples",
  "besoin de relances fréquentes": "relances +",
  "spontanéité limitée": "spontanéité",
  "difficulté à répondre aux relances": "relances diff.",
  "difficulté à reformuler": "reformulation",
  "passe à l'anglais": "anglais",
  "demande souvent de répéter": "répéter",
  "maîtrise des temps du passé": "passé OK",
  "utilisation adéquate du présent": "présent OK",
  "utilisation adéquate du futur": "futur OK",
  "bonne situation spatio-temporelle": "temps cohérents",
  "accords généralement maîtrisés": "accords OK",
  "phrases complexes bien contrôlées": "phrases complexes",
  "riche vocabulaire": "vocab. riche",
  "vocabulaire professionnel précis": "vocab. pro",
  "bonne reformulation lexicale": "reformule",
  "structure claire": "structure claire",
  "bonne fluidité": "fluidité",
  "bonne interaction": "interaction",
  "exemples efficaces": "exemples +",
  "recommandation solide": "recommandation",
  "bonne clarification": "clarification",
  "ton approprié": "ton pro",
  "bonne cohérence": "cohérence",
  "prononciation généralement claire": "pron. claire",
  "intelligibilité constante": "intelligible",
  "rythme naturel": "rythme naturel",
  "bonne articulation": "articulation +",
  "accent présent mais non gênant": "accent OK",
  "intonation appropriée": "intonation +",
  "a expliqué clairement un processus": "processus clair",
  "a donné un exemple concret pertinent": "exemple concret",
  "a comparé deux options de façon claire": "compare options",
  "a justifié une recommandation": "justifie reco.",
  "a reformulé efficacement une idée": "reformule idée",
  "a clarifié une réponse après relance": "clarifie relance",
  "a maintenu un ton professionnel": "ton pro maintenu",
  "a organisé sa réponse avec des connecteurs": "connecteurs +",
  "a décrit une situation passée avec cohérence": "passé cohérent",
};

Object.assign(tagLabels, {
  "profil pré-OF01": "pré-OF01",
  "mots isolés ou phrases mémorisées": "mots isolés",
  "très peu de français fonctionnel": "très peu FR",
  "ne soutient pas encore l'échange": "échange non soutenu",
  "phrases courtes avec soutien": "phrases soutien",
  "zone A+ / pré-B": "A+ / pré-B",
  "B proche mais instable": "B instable",
  "relances imprévisibles difficiles": "relances imprév.",
  "sujets complexes avec instabilité": "C- instable",
  "opinion soutenue mais peu nuancée": "opinion peu nuancée",
  "aisance avancée stable": "aisance C+",
  "nuance et précision soutenues": "nuance C+",
  "autonomie complète sur sujets abstraits": "autonomie C+",
  "argumentation nuancée": "argumentation C",
  "nuance soutenue": "nuance C1+",
  "souplesse discursive": "souplesse C1+",
  "précision soutenue": "précision C1+",
  "registre adapté au niveau exécutif": "registre exec.",
  "maîtrise exceptionnelle": "maîtrise C2",
  "aisance quasi native": "aisance C2",
  "nuance constante exceptionnelle": "nuance C2",
  "diplomatie sous pression": "diplomatie",
  "abstraction maîtrisée": "abstraction",
  "vocabulaire spécialisé précis": "vocab. spéc.",
  "nuance limitée pour le niveau C": "nuance limitée",
  "registre trop simple pour C": "registre simple",
  "difficulté à soutenir une position complexe": "position complexe",
});

const noteFields: NoteField[] = [
  {
    key: "generalObservations",
    label: "Observations générales",
    placeholder: "Performance communicative globale, constance, confiance, soutien requis...",
    mode: "auto",
    helper: "Alimenté par les tags d'observations générales; vous pouvez compléter ou corriger le texte.",
  },
  {
    key: "strengths",
    label: "Forces observées",
    placeholder: "Interaction, clarté, vocabulaire professionnel, stratégies de réparation...",
    mode: "auto",
    helper: "Alimenté par les tags de points forts; vous pouvez compléter ou corriger le texte.",
  },
  {
    key: "challenges",
    label: "Défis observés",
    placeholder: "Hésitation, exactitude, étendue, organisation, effort de compréhension...",
    mode: "auto",
    helper: "Alimenté par les tags de discours et d'interaction; vous pouvez compléter ou corriger le texte.",
  },
  {
    key: "preciseErrors",
    label: "Erreurs linguistiques précises",
    placeholder: "Erreurs récurrentes et exemples entendus pendant l'évaluation...",
    mode: "auto",
    helper: "Alimenté par les tags de grammaire et vocabulaire à améliorer; ajoutez des exemples entendus.",
  },
  {
    key: "strongPerformanceExamples",
    label: "Exemples de performance forte",
    placeholder: "Explications efficaces, bonnes recommandations, reformulations solides...",
    mode: "auto",
    helper: "Alimenté par les tags d'exemples forts; vous pouvez ajouter une citation ou un exemple précis.",
  },
  {
    key: "finalJudgment",
    label: "Évaluation finale de l'évaluateur",
    placeholder: "Niveau CECR/CEFR final et justification brève fondée sur les preuves...",
    mode: "manual",
    helper: "Champ manuel : à remplir après l'entretien, avec le niveau final.",
  },
];

const sleLevels: SLELevel[] = ["A-", "A", "A+", "B-", "B", "B+", "C-", "C", "C+"];

const sleLevelValues: Record<string, number> = {
  "A-": 1.6,
  A: 2,
  "A+": 2.65,
  "B-": 3.15,
  B: 3.55,
  "B+": 4.1,
  "C-": 4.7,
  C: 5.25,
  "C+": 5.8,
};

const sleCriteria: { key: CriterionKey; label: string }[] = [
  { key: "comprehensionQuestions", label: "Compréhension des questions" },
  { key: "fluency", label: "Fluidité" },
  { key: "grammar", label: "Précision grammaticale" },
  { key: "vocabulary", label: "Vocabulaire" },
  { key: "coherence", label: "Organisation du discours" },
  { key: "interaction", label: "Interaction / autonomie" },
  { key: "justification", label: "Capacité à justifier" },
  { key: "abstraction", label: "Capacité à traiter des questions abstraites" },
];

const sleLevelDescriptors: Record<SLELevel, string> = {
  "A-":
    "Pré-OF01 / très grand débutant. La personne est en dessous du point d'entrée OF01, utilise surtout des mots isolés ou des phrases mémorisées, et ne peut pas encore soutenir un échange oral simple de façon autonome.",
  A:
    "OF01-OF12 environ. La personne est dans la zone débutante du curriculum PFL2; elle peut répondre à des questions très simples, donner des informations de base et utiliser des phrases courtes avec soutien.",
  "A+":
    "OF13-OF40 environ / pré-B. La personne dépasse le tout débutant et progresse vers les fonctions nécessaires au niveau B, mais n'est pas encore un B fonctionnel stable, surtout pour développer, justifier ou répondre à des relances moins prévisibles.",
  "B-":
    "Proche du niveau B, mais encore instable. La personne peut communiquer sur des sujets professionnels familiers, expliquer des situations simples et répondre à certaines relances, mais sans stabilité suffisante.",
  B:
    "Niveau B fonctionnel. La personne peut décrire, expliquer, raconter des événements passés, comparer des options simples et justifier une opinion de base.",
  "B+":
    "B solide / transition vers C. La personne organise ses idées, justifie des recommandations, répond aux relances et gère une certaine complexité, sans stabilité C complète.",
  "C-":
    "Proche du niveau C, mais instable. La personne peut traiter des sujets plus complexes et soutenir des opinions, mais manque parfois de nuance, de précision, de spontanéité ou de structure.",
  C:
    "Niveau C fonctionnel. La personne communique efficacement et avec autonomie dans une grande variété de situations professionnelles, y compris des questions hypothétiques, abstraites ou complexes.",
  "C+":
    "C solide / avancé. La personne communique avec aisance, précision, nuance et autonomie dans des contextes professionnels et abstraits; les erreurs sont rares et ne nuisent pas à l'efficacité.",
};

const sleDescriptors: FrameworkConfig["descriptors"] = {
  comprehensionQuestions: sleLevelDescriptors,
  fluency: sleLevelDescriptors,
  grammar: sleLevelDescriptors,
  vocabulary: sleLevelDescriptors,
  coherence: sleLevelDescriptors,
  interaction: sleLevelDescriptors,
  justification: sleLevelDescriptors,
  abstraction: sleLevelDescriptors,
  pronunciation: {},
};

const sleReportTemplates: Partial<Record<AssessmentLevel, string>> = {
  "A-":
    "La personne candidate présente un profil A- en interaction orale, correspondant à un pré-OF01 / très grand débutant. Elle a très peu de français fonctionnel, utilise surtout des mots isolés ou des phrases mémorisées, et ne peut pas encore soutenir un échange oral simple de façon autonome.",
  A:
    "La personne candidate présente un profil A en interaction orale, correspondant approximativement à la zone OF01-OF12 du curriculum PFL2. Elle peut répondre à des questions très simples, donner des informations personnelles ou professionnelles de base et utiliser des phrases courtes avec soutien.",
  "A+":
    "La personne candidate présente un profil A+ en interaction orale, correspondant approximativement à la zone OF13-OF40 du curriculum PFL2 / pré-B. Elle progresse vers les fonctions nécessaires au niveau B, mais n'est pas encore un B fonctionnel stable, surtout lorsqu'il faut développer, justifier ou répondre à des relances moins prévisibles.",
  "B-":
    "La personne candidate est proche du niveau B, mais la performance demeure instable. Elle peut communiquer sur des sujets professionnels familiers, expliquer des situations simples et répondre à certaines relances, mais la fluidité, la précision, le vocabulaire ou l'autonomie restent insuffisants pour confirmer un B stable.",
  B:
    "La personne candidate présente un niveau B fonctionnel. Elle peut communiquer de façon fonctionnelle en français dans des situations professionnelles familières, décrire, expliquer, raconter des événements passés, comparer des options simples et justifier une opinion de base.",
  "B+":
    "La personne candidate démontre un B solide et une transition possible vers C. Elle peut organiser ses idées, justifier des recommandations, répondre à des relances et gérer une certaine complexité, mais elle n'est pas encore stable dans les discussions abstraites ou nuancées.",
  "C-":
    "La personne candidate approche le niveau C, mais la performance n'est pas encore stable. Elle peut traiter des sujets plus complexes, expliquer des enjeux et soutenir des opinions, mais manque parfois de nuance, de précision, de spontanéité ou de structure.",
  C:
    "La personne candidate présente un niveau C fonctionnel. Elle communique efficacement et avec autonomie dans une grande variété de situations professionnelles, explique, compare, justifie, formule des hypothèses, discute d'enjeux abstraits et répond spontanément aux questions de suivi.",
  "C+":
    "La personne candidate démontre un C solide / avancé. Elle communique avec aisance, précision, nuance et autonomie dans des contextes professionnels et abstraits. Les erreurs sont rares et ne nuisent pas à l'efficacité de la communication.",
};

const sleRecommendationTemplates: Record<string, string[]> = {
  "A-/A/A+": [
    "Consolider les objectifs de base du curriculum PFL2 : compréhension de questions simples, réponses courtes complètes, présentation du rôle et vocabulaire professionnel de base.",
    "Développer la capacité à parler de routines, de tâches familières et de situations très connues avec moins de soutien.",
    "Renforcer la construction de phrases simples, les temps essentiels et les stratégies pour demander une clarification.",
  ],
  "B-": [
    "Renforcer les bases de l'interaction orale professionnelle : comprendre les questions, répondre avec des phrases complètes et demander une clarification.",
    "Travailler les fonctions de stabilisation du niveau B : expliquer une situation, raconter un événement passé, organiser les idées et donner des raisons simples.",
    "Stabiliser la fluidité, la précision grammaticale, le vocabulaire et l'autonomie avant de confirmer un B fonctionnel.",
  ],
  "B/B+": [
    "Consolider la communication fonctionnelle sur des sujets professionnels familiers.",
    "Renforcer la précision grammaticale, l'organisation du discours et les réponses aux relances imprévues.",
    "Développer la justification, la comparaison d'options et l'expression d'opinions avec exemples.",
  ],
  "C-/C/C+": [
    "Maintenir une pratique orale avancée au moyen de discussions professionnelles complexes.",
    "Raffiner la nuance, l'expression idiomatique, le registre et la précision lexicale.",
    "Pratiquer l'argumentation de haut niveau, la diplomatie et la communication de niveau exécutif.",
  ],
};

const sleStages: Stage[] = [
  {
    id: "sle-role",
    label: "Étape 1",
    title: "Mise en confiance / rôle professionnel",
    time: "3-4 min",
    purpose: [
      "mettre la personne candidate à l'aise",
      "confirmer sa capacité à parler de son rôle",
      "observer la spontanéité de base",
    ],
    main: [
      "Pouvez-vous vous présenter brièvement ?",
      "Quel est votre rôle actuel ?",
      "Quelles sont vos principales responsabilités ?",
      "Depuis combien de temps occupez-vous ce poste ?",
      "Dans quelles situations devez-vous communiquer en français au travail ?",
    ],
    easier: [
      "Où travaillez-vous actuellement ?",
      "Quelles tâches faites-vous le plus souvent ?",
      "Travaillez-vous plutôt seul ou en équipe ?",
    ],
    advanced: [
      "Comment votre rôle a-t-il évolué récemment ?",
      "Quelles responsabilités exigent le plus de communication ?",
      "Comment adaptez-vous votre communication selon votre interlocuteur ?",
    ],
    focus: ["capacité à se présenter", "description du rôle", "vocabulaire professionnel", "fluidité", "autonomie dans les réponses"],
  },
  {
    id: "sle-narration",
    label: "Étape 2",
    title: "Expérience passée / narration",
    time: "5-6 min",
    purpose: [
      "évaluer la capacité à raconter une expérience passée",
      "organiser les événements",
      "utiliser les temps du passé",
    ],
    main: [
      "Parlez-moi d'un projet récent auquel vous avez participé.",
      "Décrivez une situation où vous avez dû respecter une échéance importante.",
      "Racontez une difficulté que vous avez rencontrée au travail et expliquez ce que vous avez fait.",
      "Parlez-moi d'une réunion ou d'une situation professionnelle importante.",
    ],
    followUps: [
      "Quand cela s'est-il passé ?",
      "Quel était votre rôle ?",
      "Quelles étapes avez-vous suivies ?",
      "Quel a été le résultat ?",
      "Qu'auriez-vous fait différemment ?",
    ],
    easier: ["Décrivez simplement ce qui s'est passé.", "Qu'avez-vous fait en premier ?", "Quel a été le résultat ?"],
    advanced: [
      "Quelles leçons avez-vous tirées de cette situation ?",
      "Comment cette expérience a-t-elle influencé votre façon de travailler ?",
      "Quelles conséquences cette situation a-t-elle eues pour votre équipe ?",
    ],
    focus: [
      "utilisation du passé composé / imparfait",
      "capacité à raconter",
      "ordre chronologique",
      "précision des détails",
      "réflexion sur l'expérience",
    ],
  },
  {
    id: "sle-process",
    label: "Étape 3",
    title: "Explication d'un processus",
    time: "5-7 min",
    purpose: ["évaluer la capacité à expliquer clairement une procédure ou une décision professionnelle"],
    main: [
      "Expliquez comment vous préparez un dossier, un rapport ou une note pour votre gestionnaire.",
      "Expliquez comment vous organisez vos priorités lorsqu'il y a plusieurs demandes urgentes.",
      "Décrivez comment une décision est prise dans votre équipe.",
      "Expliquez comment vous traitez une demande urgente.",
    ],
    followUps: [
      "Quelles sont les étapes principales ?",
      "Qui doit être consulté ?",
      "Quels documents sont nécessaires ?",
      "Comment vérifiez-vous que le travail est complet ?",
      "Que faites-vous si des informations sont manquantes ?",
    ],
    easier: ["Que faites-vous en premier ?", "Que faites-vous ensuite ?", "Qui contactez-vous ?"],
    advanced: [
      "Comment ce processus pourrait-il être amélioré ?",
      "Quels risques peuvent survenir ?",
      "Comment adapteriez-vous ce processus dans un contexte plus urgent ?",
      "Comment expliqueriez-vous ce processus à une personne qui ne connaît pas votre domaine ?",
    ],
    focus: ["organisation", "connecteurs", "clarté", "précision", "vocabulaire professionnel", "cause et conséquence"],
  },
  {
    id: "sle-compare",
    label: "Étape 4",
    title: "Comparaison de deux options",
    time: "5-7 min",
    purpose: ["évaluer la capacité à comparer, nuancer et recommander une option"],
    main: [
      "Votre équipe hésite entre deux solutions pour respecter une échéance. Comparez-les et recommandez la meilleure.",
      "Comparez les avantages d'une réunion virtuelle et d'une réunion en personne.",
      "Comparez deux façons d'améliorer la collaboration dans une équipe.",
      "Comparez deux méthodes pour communiquer une décision importante.",
    ],
    followUps: [
      "Quels sont les avantages de chaque option ?",
      "Quels sont les désavantages ?",
      "Quelle option est la plus réaliste ?",
      "Quels seraient les risques ?",
      "Quelle option recommandez-vous et pourquoi ?",
    ],
    easier: ["Quelle option préférez-vous ?", "Quels sont les avantages ?", "Quels sont les problèmes possibles ?"],
    advanced: [
      "Comment votre recommandation changerait-elle si les délais étaient très courts ?",
      "Comment tiendriez-vous compte des contraintes budgétaires ?",
      "Comment présenteriez-vous cette recommandation à la haute direction ?",
      "Quels compromis seraient nécessaires ?",
    ],
    focus: ["comparaison", "justification", "nuance", "connecteurs d'opposition", "capacité à recommander"],
  },
  {
    id: "sle-opinion",
    label: "Étape 5",
    title: "Opinion et justification",
    time: "5-7 min",
    purpose: ["évaluer la capacité à exprimer une opinion, la défendre et répondre à des questions de suivi"],
    main: [
      "Selon vous, quelles sont les qualités les plus importantes pour bien travailler en équipe ?",
      "Pensez-vous que le télétravail améliore la productivité ? Pourquoi ?",
      "Est-il préférable de communiquer une décision importante par écrit ou en réunion ?",
      "Selon vous, comment peut-on améliorer la communication dans une organisation ?",
      "Quelle est l'importance de la formation continue dans le milieu professionnel ?",
    ],
    followUps: [
      "Pourquoi pensez-vous cela ?",
      "Pouvez-vous donner un exemple ?",
      "Quels sont les avantages et les limites ?",
      "Que diriez-vous à une personne qui n'est pas d'accord ?",
      "Votre opinion changerait-elle selon le contexte ?",
    ],
    easier: ["Êtes-vous d'accord ou non ?", "Pourquoi ?", "Pouvez-vous donner un exemple simple ?"],
    advanced: [
      "Quels seraient les impacts à long terme ?",
      "Comment cette question touche-t-elle la gestion des ressources ?",
      "Quelles nuances faut-il apporter ?",
      "Comment défendriez-vous votre point de vue devant un comité ?",
    ],
    focus: ["opinion", "justification", "capacité à développer", "nuance", "spontanéité", "réaction aux objections"],
  },
  {
    id: "sle-scenario",
    label: "Étape 6",
    title: "Scénario hypothétique professionnel",
    time: "6-8 min",
    purpose: [
      "évaluer la capacité à réagir à une situation complexe",
      "proposer des solutions",
      "maintenir une interaction professionnelle",
    ],
    main: [
      "Un partenaire ne peut pas respecter une échéance importante. Vous devez expliquer les conséquences possibles, clarifier la situation et proposer des solutions réalistes.",
    ],
    alternatives: [
      "Un document important contient des erreurs et doit être corrigé rapidement.",
      "Un client interne demande une réponse urgente, mais l'information n'est pas encore disponible.",
      "Deux équipes ne s'entendent pas sur les prochaines étapes d'un projet.",
      "Une réunion importante doit être reportée à la dernière minute.",
      "Un nouveau processus crée de la confusion dans l'équipe.",
    ],
    followUps: [
      "Quelle information devez-vous obtenir en premier ?",
      "Qui devrait être informé ?",
      "Comment expliqueriez-vous l'impact du retard ?",
      "Quelles solutions proposeriez-vous ?",
      "Comment limiteriez-vous les risques ?",
      "Que feriez-vous si le partenaire ne répondait pas rapidement ?",
    ],
    easier: ["Que feriez-vous en premier ?", "Qui contacteriez-vous ?", "Comment expliqueriez-vous le problème ?"],
    advanced: [
      "Comment géreriez-vous cette situation si elle avait des implications politiques ou financières ?",
      "Comment rédigeriez-vous un message diplomatique à un partenaire externe ?",
      "Comment présenteriez-vous les risques à la haute direction ?",
      "Comment maintiendriez-vous la relation avec le partenaire malgré le problème ?",
    ],
    focus: ["interaction spontanée", "résolution de problème", "ton professionnel", "diplomatie", "précision", "complexité"],
  },
  {
    id: "sle-extension-c",
    label: "Étape 7",
    title: "Extension niveau C",
    time: "5-8 min",
    optional: true,
    purpose: ["vérifier si la personne candidate dépasse le niveau B et peut soutenir une discussion de niveau C"],
    main: [
      "Quels sont les principaux défis liés à la transformation numérique dans les organisations publiques ?",
      "Comment une organisation peut-elle maintenir la qualité des services tout en réduisant les coûts ?",
      "Quel rôle la communication joue-t-elle dans la gestion du changement ?",
      "Comment concilier rapidité, transparence et prudence dans la prise de décision ?",
      "Quels sont les risques d'une mauvaise communication entre partenaires internes et externes ?",
      "Comment les gestionnaires peuvent-ils soutenir l'innovation tout en respectant les règles administratives ?",
      "Selon vous, quelles compétences seront essentielles dans la fonction publique de demain ?",
    ],
    followUps: [
      "Pouvez-vous nuancer votre réponse ?",
      "Quels seraient les effets à long terme ?",
      "Y a-t-il des risques ou des limites ?",
      "Comment cette question pourrait-elle être perçue par différents groupes ?",
      "Pouvez-vous proposer une approche équilibrée ?",
      "Comment défendriez-vous cette position devant des cadres supérieurs ?",
    ],
    focus: [
      "pensée abstraite",
      "nuance",
      "argumentation",
      "hypothèses",
      "discussion complexe",
      "précision",
      "autonomie discursive",
    ],
  },
];

const sleQuickTagGroups: QuickTagGroup[] = [
  {
    title: "Observations générales",
    description: "Profil global à réutiliser dans le rapport interne PFL2/SLE.",
    target: "generalObservations",
    prefix: "observation générale",
    tone: "neutral",
    view: "global",
    tags: [
      "profil pré-OF01",
      "mots isolés ou phrases mémorisées",
      "phrases courtes avec soutien",
      "zone A+ / pré-B",
      "B proche mais instable",
      "communication fonctionnelle",
      "bonne autonomie dans l'échange",
      "performance inégale selon la tâche",
      "réponses très courtes",
      "soutien fréquent requis",
      "répond mieux aux questions concrètes",
      "difficulté avec les questions abstraites",
      "compréhension généralement adéquate",
      "compréhension limitée sans reformulation",
      "aisance plus forte sur sujets familiers",
    ],
  },
  {
    title: "Points à améliorer - langue",
    description: "À utiliser pour noter les limites de grammaire, vocabulaire ou précision.",
    target: "preciseErrors",
    prefix: "langue à améliorer",
    tone: "challenge",
    view: "improve",
    tags: [
      "très peu de français fonctionnel",
      "temps verbaux instables",
      "passé non maîtrisé",
      "accords fréquents à corriger",
      "structure de phrase fragile",
      "vocabulaire limité",
      "vocabulaire imprécis",
      "cherche souvent ses mots",
    ],
  },
  {
    title: "Points à améliorer - discours et interaction",
    description: "À utiliser pour les limites de structure, justification, autonomie ou abstraction.",
    target: "challenges",
    prefix: "discours et interaction",
    tone: "challenge",
    view: "improve",
    tags: [
      "ne soutient pas encore l'échange",
      "organisation peu claire",
      "connecteurs limités",
      "justification faible",
      "difficulté à comparer des options",
      "besoin de relances fréquentes",
      "spontanéité limitée",
      "difficulté à répondre aux relances",
      "relances imprévisibles difficiles",
      "difficulté à soutenir une position complexe",
      "nuance limitée pour le niveau C",
    ],
  },
  {
    title: "Points forts - niveau B solide",
    description: "À utiliser pour les preuves fonctionnelles et autonomes.",
    target: "strengths",
    prefix: "force PFL2/SLE",
    tone: "strength",
    view: "strengths",
    tags: [
      "structure claire",
      "bonne fluidité",
      "bonne interaction",
      "exemples efficaces",
      "recommandation solide",
      "bonne clarification",
      "ton approprié",
      "bonne cohérence",
      "a décrit une situation passée avec cohérence",
    ],
  },
  {
    title: "Preuves niveau C",
    description: "À utiliser seulement si la personne candidate soutient une discussion complexe ou abstraite.",
    target: "strengths",
    prefix: "preuve niveau C",
    tone: "strength",
    view: "strengths",
    tags: [
      "argumentation nuancée",
      "sujets complexes avec instabilité",
      "opinion soutenue mais peu nuancée",
      "diplomatie sous pression",
      "abstraction maîtrisée",
      "vocabulaire spécialisé précis",
      "registre adapté au niveau exécutif",
      "aisance avancée stable",
      "nuance et précision soutenues",
      "autonomie complète sur sujets abstraits",
    ],
  },
  {
    title: "Exemples de performance forte",
    description: "Formulations utiles pour illustrer le rapport interne.",
    target: "strongPerformanceExamples",
    prefix: "exemple fort",
    tone: "strength",
    view: "examples",
    tags: [
      "a expliqué clairement un processus",
      "a donné un exemple concret pertinent",
      "a comparé deux options de façon claire",
      "a justifié une recommandation",
      "a reformulé efficacement une idée",
      "a clarifié une réponse après relance",
      "a maintenu un ton professionnel",
    ],
  },
];

const sleFrequentTagValues = [
  "profil pré-OF01",
  "phrases courtes avec soutien",
  "zone A+ / pré-B",
  "B proche mais instable",
  "communication fonctionnelle",
  "réponses très courtes",
  "soutien fréquent requis",
  "compréhension limitée sans reformulation",
  "temps verbaux instables",
  "vocabulaire limité",
  "bonne fluidité",
  "bonne interaction",
  "justification faible",
  "difficulté avec les questions abstraites",
  "argumentation nuancée",
  "sujets complexes avec instabilité",
  "abstraction maîtrisée",
  "aisance avancée stable",
];

const sleTagSuggestionRules: SuggestionRule[] = [
  { tag: "profil pré-OF01", criteria: ["comprehensionQuestions", "fluency", "interaction"], score: 1.55, reason: "profil pré-OF01" },
  { tag: "mots isolés ou phrases mémorisées", criteria: ["fluency", "vocabulary", "grammar"], score: 1.65, reason: "mots isolés ou phrases mémorisées" },
  { tag: "très peu de français fonctionnel", criteria: ["comprehensionQuestions", "interaction", "vocabulary"], score: 1.6, reason: "très peu de français fonctionnel" },
  { tag: "ne soutient pas encore l'échange", criteria: ["interaction", "fluency"], score: 1.8, reason: "échange non soutenu" },
  { tag: "phrases courtes avec soutien", criteria: ["fluency", "grammar", "interaction"], score: 2.15, reason: "phrases courtes avec soutien" },
  { tag: "communication fonctionnelle", criteria: ["comprehensionQuestions", "fluency", "interaction"], score: 3.4, reason: "communication fonctionnelle" },
  { tag: "réponses très courtes", criteria: ["fluency", "coherence"], score: 2.2, reason: "réponses très courtes" },
  { tag: "soutien fréquent requis", criteria: ["comprehensionQuestions", "interaction"], score: 2.3, reason: "soutien fréquent requis" },
  { tag: "compréhension limitée sans reformulation", criteria: ["comprehensionQuestions", "interaction"], score: 2.2, reason: "compréhension fragile" },
  { tag: "zone A+ / pré-B", criteria: ["coherence", "interaction", "justification"], score: 2.85, reason: "zone A+ / pré-B" },
  { tag: "temps verbaux instables", criteria: ["grammar"], score: 2.8, reason: "temps verbaux instables" },
  { tag: "passé non maîtrisé", criteria: ["grammar", "coherence"], score: 2.4, reason: "narration au passé fragile" },
  { tag: "vocabulaire limité", criteria: ["vocabulary"], score: 2.6, reason: "vocabulaire limité" },
  { tag: "organisation peu claire", criteria: ["coherence"], score: 2.6, reason: "organisation peu claire" },
  { tag: "justification faible", criteria: ["justification", "coherence"], score: 2.8, reason: "justification limitée" },
  { tag: "difficulté avec les questions abstraites", criteria: ["abstraction", "justification"], score: 2.7, reason: "abstraction fragile" },
  { tag: "B proche mais instable", criteria: ["comprehensionQuestions", "interaction", "fluency"], score: 3.2, reason: "B proche mais instable" },
  { tag: "relances imprévisibles difficiles", criteria: ["interaction", "justification"], score: 3.05, reason: "relances imprévisibles difficiles" },
  { tag: "bonne fluidité", criteria: ["fluency"], score: 4.2, reason: "bonne fluidité" },
  { tag: "bonne interaction", criteria: ["interaction", "comprehensionQuestions"], score: 4.2, reason: "interaction autonome" },
  { tag: "structure claire", criteria: ["coherence"], score: 4.1, reason: "structure claire" },
  { tag: "recommandation solide", criteria: ["justification"], score: 4.2, reason: "recommandation solide" },
  { tag: "a décrit une situation passée avec cohérence", criteria: ["coherence", "grammar"], score: 4.1, reason: "narration cohérente" },
  { tag: "sujets complexes avec instabilité", criteria: ["abstraction", "coherence"], score: 4.75, reason: "complexité instable" },
  { tag: "opinion soutenue mais peu nuancée", criteria: ["justification", "abstraction"], score: 4.85, reason: "opinion soutenue mais peu nuancée" },
  { tag: "argumentation nuancée", criteria: ["justification", "abstraction"], score: 5.35, reason: "argumentation nuancée" },
  { tag: "abstraction maîtrisée", criteria: ["abstraction", "coherence"], score: 5.45, reason: "abstraction maîtrisée" },
  { tag: "vocabulaire spécialisé précis", criteria: ["vocabulary", "abstraction"], score: 5.3, reason: "vocabulaire spécialisé" },
  { tag: "registre adapté au niveau exécutif", criteria: ["interaction", "justification"], score: 5.35, reason: "registre exécutif" },
  { tag: "aisance avancée stable", criteria: ["fluency", "interaction", "abstraction"], score: 5.65, reason: "aisance avancée stable" },
  { tag: "nuance et précision soutenues", criteria: ["vocabulary", "justification", "abstraction"], score: 5.75, reason: "nuance et précision soutenues" },
  { tag: "autonomie complète sur sujets abstraits", criteria: ["interaction", "coherence", "abstraction"], score: 5.7, reason: "autonomie complète sur sujets abstraits" },
  { tag: "difficulté à soutenir une position complexe", criteria: ["justification", "abstraction"], score: 3.1, reason: "position complexe fragile" },
  { tag: "nuance limitée pour le niveau C", criteria: ["abstraction", "justification"], score: 3.7, reason: "nuance limitée pour C" },
];

const slePerformanceSuggestionRules: FrameworkConfig["performanceSuggestionRules"] = {
  comprehension: {
    1: { criteria: ["comprehensionQuestions", "interaction"], score: 2.2, reason: "compréhension fragile" },
    2: { criteria: ["comprehensionQuestions", "interaction"], score: 3.4, reason: "compréhension fonctionnelle" },
    3: { criteria: ["comprehensionQuestions", "interaction"], score: 4.3, reason: "compréhension solide" },
  },
  autonomy: {
    1: { criteria: ["interaction", "fluency"], score: 2.3, reason: "autonomie fragile" },
    2: { criteria: ["interaction", "fluency"], score: 3.5, reason: "autonomie fonctionnelle" },
    3: { criteria: ["interaction", "fluency"], score: 4.4, reason: "autonomie solide" },
  },
  complexity: {
    1: { criteria: ["coherence", "vocabulary", "abstraction"], score: 2.7, reason: "complexité limitée" },
    2: { criteria: ["coherence", "vocabulary", "abstraction"], score: 3.6, reason: "complexité fonctionnelle" },
    3: { criteria: ["coherence", "vocabulary", "abstraction"], score: 5.0, reason: "complexité soutenue" },
  },
  precision: {
    1: { criteria: ["grammar", "vocabulary"], score: 2.5, reason: "précision fragile" },
    2: { criteria: ["grammar", "vocabulary"], score: 3.5, reason: "précision fonctionnelle" },
    3: { criteria: ["grammar", "vocabulary"], score: 4.5, reason: "précision solide" },
  },
};

const CEFR_CCC_CONFIG: FrameworkConfig = {
  id: "cefr-ccc",
  selectorLabel: "CCC – CECR/CEFR",
  modeLabel: "CCC – CECR/CEFR",
  appTitle: "Console d'évaluation orale KC - CCC CECR/CEFR",
  defaultClient: "CCC",
  ratingTitle: "Grille d'évaluation CECR / CEFR",
  ratingAriaLabel: "Grille d'évaluation CECR CEFR",
  ratingHelp:
    "Les suggestions sont générées localement à partir des tags rapides et des repères d'observation. Elles doivent être confirmées ou modifiées par l'évaluateur.",
  finalProfileLabel: "Profil d'interaction orale CECR/CEFR",
  summaryTitle: "Résumé CECR/CEFR généré",
  summaryButtonLabel: "Générer le résumé CECR",
  summaryPlaceholder: "Générez un résumé CECR/CEFR prêt pour le rapport après avoir sélectionné les cotes et ajouté des notes.",
  summaryReportTarget: "rapport d'évaluation CCC",
  unconfirmedLevelNote: "Lecture du niveau à confirmer après la sélection des critères CECR/CEFR.",
  levels,
  levelValues,
  criteria,
  descriptors: descriptors as FrameworkConfig["descriptors"],
  reportTemplates,
  levelProfileLines,
  recommendationTemplates,
  stages,
  quickTagGroups,
  frequentTagValues,
  tagLabels,
  tagSuggestionRules,
  performanceSuggestionRules,
  cProbeQuestions,
  guideSteps: evaluatorGuideSteps,
};

const PFL2_SLE_CONFIG: FrameworkConfig = {
  id: "pfl2-sle",
  selectorLabel: "PFL2 / SLE – A-C",
  modeLabel: "PFL2 / SLE – A-C",
  appTitle: "Console d'évaluation orale KC - PFL2/SLE A-C",
  defaultClient: "PFL2 / SLE",
  ratingTitle: "Grille d'évaluation PFL2 / SLE",
  ratingAriaLabel: "Grille d'évaluation PFL2 SLE",
  ratingHelp:
    "Suggestion basée sur les observations sélectionnées. Le niveau final doit être confirmé par l'évaluateur ou l'évaluatrice.",
  finalProfileLabel: "Profil oral estimé PFL2 / SLE",
  summaryTitle: "Résumé PFL2 / SLE généré",
  summaryButtonLabel: "Générer le résumé PFL2/SLE",
  summaryPlaceholder: "Générez un résumé PFL2/SLE prêt pour le rapport interne après avoir sélectionné les cotes et ajouté des notes.",
  summaryReportTarget: "rapport interne PFL2/SLE",
  unconfirmedLevelNote: "Lecture du niveau à confirmer après la sélection des critères PFL2/SLE.",
  disclaimer:
    "Ce profil est une estimation interne et ne constitue pas un résultat officiel de la Commission de la fonction publique.",
  levels: sleLevels,
  levelValues: sleLevelValues,
  criteria: sleCriteria,
  descriptors: sleDescriptors,
  reportTemplates: sleReportTemplates,
  levelProfileLines: sleReportTemplates,
  recommendationTemplates: sleRecommendationTemplates,
  stages: sleStages,
  quickTagGroups: sleQuickTagGroups,
  frequentTagValues: sleFrequentTagValues,
  tagLabels: { ...tagLabels },
  tagSuggestionRules: sleTagSuggestionRules,
  performanceSuggestionRules: slePerformanceSuggestionRules,
  cProbeQuestions: [],
  guideSteps: [
    "Choisir le mode PFL2 / SLE – A-C dans l'en-tête avant de commencer.",
    "Entrer les renseignements de départ, puis passer en mode évaluation.",
    "Utiliser les étapes 1 à 6 pour situer la performance entre A-, A, A+, B et C. La zone A+ correspond à OF13-OF40 / pré-B; OF40 n'est pas traité comme B.",
    "Activer l'extension niveau C seulement si la personne candidate montre des preuves solides au-dessus de B.",
    "Après le départ de la personne candidate, cliquer sur Finaliser, confirmer ou modifier les niveaux PFL2/SLE.",
    "Choisir ou adapter une formulation dans la banque, puis générer le résumé interne.",
  ],
};

const frameworkConfigs: Record<FrameworkId, FrameworkConfig> = {
  "cefr-ccc": CEFR_CCC_CONFIG,
  "pfl2-sle": PFL2_SLE_CONFIG,
};

function createEmptyRatings(): CriterionRating {
  return {
    comprehensionQuestions: "",
    fluency: "",
    interaction: "",
    grammar: "",
    vocabulary: "",
    coherence: "",
    pronunciation: "",
    justification: "",
    abstraction: "",
    finalLevel: "",
  };
}

function createEmptyNotes(): AssessmentNotes {
  return {
    generalObservations: "",
    strengths: "",
    challenges: "",
    preciseErrors: "",
    strongPerformanceExamples: "",
    finalJudgment: "",
  };
}

function createEmptyPerformance(): Record<PerformanceKey, PerformanceValue> {
  return {
    comprehension: 0,
    autonomy: 0,
    complexity: 0,
    precision: 0,
  };
}

function getFrameworkStages(config: FrameworkConfig, cExtensionEnabled = false) {
  return config.stages.filter((stage) => !stage.optional || cExtensionEnabled);
}

function createSession(frameworkId: FrameworkId = "cefr-ccc"): OralAssessmentSession {
  const now = new Date().toISOString();
  const config = frameworkConfigs[frameworkId];

  return {
    id: crypto.randomUUID(),
    frameworkId,
    candidate: {
      fullName: "",
      email: "",
      client: config.defaultClient,
      assessmentLanguage: "Français",
      assessmentType: "Interaction orale",
      assessmentDate: new Date().toISOString().slice(0, 10),
      evaluatorName: "",
      mode: "Microsoft Teams",
      positionContext: "",
      targetLevel: "",
      preAssessmentNotes: "",
    },
    ratings: createEmptyRatings(),
    notes: createEmptyNotes(),
    selectedStage: config.stages[0].id,
    summary: "",
    cExtensionEnabled: false,
    trainingEstimate: { ...defaultTrainingEstimate },
    createdAt: now,
    updatedAt: now,
  };
}

function getTagBaseText(group: QuickTagGroup, tag: string) {
  return group.prefix ? `${group.prefix} : ${tag}` : tag;
}

function getTagText(group: QuickTagGroup, tag: string, state: Exclude<TagState, "inactive"> = "normal") {
  const base = getTagBaseText(group, tag);
  return state === "strong" ? `${base} (fortement observé)` : base;
}

function getTagLabel(tag: string, config: FrameworkConfig) {
  return config.tagLabels[tag] ?? tag;
}

function getTagGroupsForView(view: TagView, config: FrameworkConfig) {
  return view === "frequent" ? [] : config.quickTagGroups.filter((group) => group.view === view);
}

function getFrequentTagActions(config: FrameworkConfig) {
  return config.frequentTagValues
    .map((value) => {
      const group = config.quickTagGroups.find((candidate) => candidate.tags.includes(value));
      return group ? { group, tag: value } : null;
    })
    .filter((item): item is { group: QuickTagGroup; tag: string } => Boolean(item));
}

function getGroupShortLabel(group: QuickTagGroup) {
  const title = group.title.toLowerCase();

  if (group.view === "global") return "Global";
  if (group.view === "examples") return "Exemple";
  if (title.includes("grammaire")) return "Grammaire";
  if (title.includes("vocabulaire")) return "Vocabulaire";
  if (title.includes("discours")) return "Discours";
  if (title.includes("interaction")) return "Interaction";
  if (title.includes("prononciation")) return "Prononciation";
  if (title.includes("approfondissement c")) return "C avancé";
  return "Force";
}

function normalizeTrainingEstimate(settings?: Partial<TrainingEstimateSettings>): TrainingEstimateSettings {
  const mode: TrainingEstimateMode =
    settings?.mode === "of" || settings?.mode === "none" || settings?.mode === "auto" ? settings.mode : "auto";
  const point = pfl2OfTrainingEstimates.some((item) => item.point === settings?.point) ? settings?.point ?? "" : "";

  return {
    mode,
    point,
  };
}

function formatPfl2Weeks(groupWeeks: number, ilpWeeks: number) {
  return `${groupWeeks} semaines en groupe / ${ilpWeeks} semaines en ILP`;
}

function getPfl2TrainingEstimate(settings: TrainingEstimateSettings, level: AssessmentLevel | "") {
  if (settings.mode === "none") {
    return {
      title: "Estimation non incluse",
      lines: ["Aucune estimation de durée ne sera ajoutée au résumé généré."],
      reportText: "",
    };
  }

  if (settings.mode === "of") {
    const point = pfl2OfTrainingEstimates.find((item) => item.point === settings.point);

    if (!point) {
      return {
        title: "Point OF à préciser",
        lines: ["Choisissez un point OF estimé pour afficher une estimation plus précise."],
        reportText: "",
      };
    }

    const toB = formatPfl2Weeks(point.groupB, point.ilpB);
    const toC = formatPfl2Weeks(point.groupC, point.ilpC);

    return {
      title: `Point de départ : ${point.label}`,
      lines: [
        `Vers B / repère OF40-pré-B : ${toB}.`,
        `Vers C / Milestone 6 : ${toC}.`,
      ],
      reportText: `Estimation indicative de parcours PFL2 :
Point de départ utilisé : ${point.label}
- Vers B / repère OF40-pré-B : ${toB}.
- Vers C / Milestone 6 : ${toC}.
Cette estimation est indicative. Elle dépend du rythme de formation, de l'assiduité, de l'exposition au français, de la progression réelle et de la confirmation de la performance orale par l'évaluateur ou l'évaluatrice.`,
    };
  }

  if (!level || !pfl2AutoTrainingEstimates[level as SLELevel]) {
    return {
      title: "Niveau final à valider",
      lines: ["Validez le niveau final PFL2/SLE pour afficher une estimation automatique."],
      reportText: "",
    };
  }

  const estimate = pfl2AutoTrainingEstimates[level as SLELevel];

  return {
    title: `Estimation automatique : ${estimate.label}`,
    lines: [
      `Temps estimé vers B : ${estimate.toB}.`,
      `Temps estimé vers C : ${estimate.toC}.`,
    ],
    reportText: `Estimation indicative de parcours PFL2 :
Point de départ utilisé : ${estimate.label}
- Temps estimé vers B : ${estimate.toB}.
- Temps estimé vers C : ${estimate.toC}.
Cette estimation est indicative. Elle dépend du rythme de formation, de l'assiduité, de l'exposition au français, de la progression réelle et de la confirmation de la performance orale par l'évaluateur ou l'évaluatrice.`,
  };
}

function App() {
  const [session, setSession] = React.useState<OralAssessmentSession>(() => createSession());
  const [frameworkChosen, setFrameworkChosen] = React.useState(false);
  const [candidatePanelOpen, setCandidatePanelOpen] = React.useState(true);
  const [assessmentStarted, setAssessmentStarted] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>("live");
  const [lastLiveStage, setLastLiveStage] = React.useState(CEFR_CCC_CONFIG.stages[0].id);
  const [tagView, setTagView] = React.useState<TagView>("frequent");
  const [performance, setPerformance] = React.useState<Record<PerformanceKey, PerformanceValue>>(() =>
    createEmptyPerformance(),
  );
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [savedStatus, setSavedStatus] = React.useState("Aucun brouillon local sauvegardé dans ce navigateur.");
  const [copyStatus, setCopyStatus] = React.useState("");
  const [showGuidePage, setShowGuidePage] = React.useState(false);
  const [showEvidenceReminder, setShowEvidenceReminder] = React.useState(false);
  const [evidenceReminderCriteria, setEvidenceReminderCriteria] = React.useState<MissingEvidenceCriterion[]>([]);
  const latestDraftRef = React.useRef({ session, performance });

  React.useEffect(() => {
    latestDraftRef.current = { session, performance };
  }, [session, performance]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const start = new Date(session.createdAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [session.createdAt]);

  React.useEffect(() => {
    if (!frameworkChosen) {
      return;
    }

    const autoSaveTimer = window.setInterval(() => {
      const { session: currentSession, performance: currentPerformance } = latestDraftRef.current;
      const nextSession = { ...currentSession, updatedAt: new Date().toISOString() };

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...nextSession, performance: currentPerformance }));
      setSavedStatus(`Sauvegarde automatique à ${new Date().toLocaleTimeString()}.`);
    }, AUTO_SAVE_INTERVAL_MS);

    return () => window.clearInterval(autoSaveTimer);
  }, [frameworkChosen]);

  const activeFramework = frameworkConfigs[session.frameworkId ?? "cefr-ccc"];
  const activeStages = getFrameworkStages(activeFramework, session.cExtensionEnabled);
  const visibleStages = frameworkChosen ? activeStages : [];
  const activeCriteria = activeFramework.criteria;
  const activeLevels = activeFramework.levels;
  const activeQuickTagGroups = activeFramework.quickTagGroups;
  const selectedStage = activeStages.find((stage) => stage.id === session.selectedStage) ?? activeStages[0];
  const activeTagEvidence = getActiveTagEvidence();
  const criterionSuggestions = getCriterionSuggestions(activeTagEvidence, performance, activeFramework);
  const ratingSuggestedLevel = getSuggestedLevel(session.ratings, activeFramework);
  const evidenceSuggestedLevel = getSuggestedLevelFromSuggestions(criterionSuggestions, activeFramework);
  const suggestedLevel = ratingSuggestedLevel || evidenceSuggestedLevel;
  const finalLevel = session.ratings.finalLevel || suggestedLevel || "";
  const tagStats = getTagStats();
  const shouldPromptCProbe =
    activeFramework.id === "cefr-ccc" && shouldShowCProbe(suggestedLevel, session.ratings, tagStats, performance, activeFramework);
  const coherenceAlert = getCoherenceAlert(finalLevel, suggestedLevel, tagStats, activeFramework);
  const judgmentPhraseOptions = getJudgmentPhraseOptions(finalLevel, activeTagEvidence, performance, tagStats, activeFramework);
  const hasFinalJudgment = Boolean(session.notes.finalJudgment.trim());
  const hasValidatedFinalLevel = Boolean(session.ratings.finalLevel);
  const showTrainingEstimatePanel = activeFramework.id === "pfl2-sle" && hasValidatedFinalLevel;
  const trainingEstimate = getPfl2TrainingEstimate(session.trainingEstimate, session.ratings.finalLevel);
  const structuredNoteFields = noteFields.filter((field) => field.key !== "finalJudgment");

  function updateCandidate<K extends keyof CandidateInfo>(key: K, value: CandidateInfo[K]) {
    setSession((current) => ({
      ...current,
      candidate: { ...current.candidate, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateRating<K extends keyof CriterionRating>(key: K, value: CriterionRating[K]) {
    setSession((current) => ({
      ...current,
      ratings: { ...current.ratings, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateNote<K extends NotesKey>(key: K, value: AssessmentNotes[K]) {
    setSession((current) => ({
      ...current,
      notes: { ...current.notes, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateTrainingEstimate(next: Partial<TrainingEstimateSettings>) {
    setSession((current) => ({
      ...current,
      trainingEstimate: normalizeTrainingEstimate({ ...current.trainingEstimate, ...next }),
      summary: "",
      updatedAt: new Date().toISOString(),
    }));
  }

  function selectStage(stageId: string) {
    if (stageId !== "final") {
      setLastLiveStage(stageId);
    }

    setSession((current) => ({
      ...current,
      selectedStage: stageId,
      updatedAt: new Date().toISOString(),
    }));

    window.setTimeout(() => {
      document.querySelector(".stagePanel")?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 0);
  }

  function toggleTag(group: QuickTagGroup, tag: string) {
    setSession((current) => {
      const target = group.target;
      const currentText = current.notes[target].trim();
      const normalTag = getTagText(group, tag, "normal");
      const strongTag = getTagText(group, tag, "strong");
      const currentTags = currentText
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
      const hasNormal = currentTags.includes(normalTag);
      const hasStrong = currentTags.includes(strongTag);
      const withoutTag = currentTags.filter((item) => item !== normalTag && item !== strongTag);
      const nextTags = hasStrong ? withoutTag : [...withoutTag, hasNormal ? strongTag : normalTag];
      const nextText = nextTags.join("; ");

      return {
        ...current,
        notes: { ...current.notes, [target]: nextText },
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function getTagState(group: QuickTagGroup, tag: string): TagState {
    const target = group.target;
    const normalTag = getTagText(group, tag, "normal");
    const strongTag = getTagText(group, tag, "strong");
    const currentTags = session.notes[target]
      .split(";")
      .map((item) => item.trim());

    if (currentTags.includes(strongTag)) return "strong";
    if (currentTags.includes(normalTag)) return "normal";
    return "inactive";
  }

  function isTagActive(group: QuickTagGroup, tag: string) {
    return getTagState(group, tag) !== "inactive";
  }

  function getTagStats(): TagStats {
    return activeQuickTagGroups.reduce(
      (stats, group) => {
        group.tags.forEach((tag) => {
          const state = getTagState(group, tag);

          if (state === "inactive") {
            return;
          }

          stats.total += 1;
          stats[group.tone] += 1;

          if (state === "strong") {
            stats.strongIntensity += 1;
          }
        });

        return stats;
      },
      { total: 0, challenge: 0, neutral: 0, strength: 0, strongIntensity: 0 } as TagStats,
    );
  }

  function getActiveTagEvidence(): ActiveTagEvidence[] {
    return activeQuickTagGroups.flatMap((group) =>
      group.tags.flatMap((tag) => {
        const state = getTagState(group, tag);

        return state === "inactive" ? [] : [{ group, tag, state }];
      }),
    );
  }

  const selectedTagCount = activeQuickTagGroups.reduce(
    (count, group) => count + group.tags.filter((tag) => isTagActive(group, tag)).length,
    0,
  );
  const frequentTagActions = getFrequentTagActions(activeFramework);
  const visibleTagGroups = getTagGroupsForView(tagView, activeFramework).filter(
    (group) => shouldPromptCProbe || !group.title.toLowerCase().includes("approfondissement c"),
  );
  const liveStageIndex = Math.max(0, activeStages.findIndex((stage) => stage.id === session.selectedStage));
  const nextStage = activeStages[liveStageIndex + 1];
  const liveStrengthTags = activeTagEvidence
    .filter(({ group }) => group.tone === "strength")
    .map(({ tag }) => getTagLabel(tag, activeFramework))
    .slice(0, 3);
  const liveChallengeTags = activeTagEvidence
    .filter(({ group }) => group.tone === "challenge")
    .map(({ tag }) => getTagLabel(tag, activeFramework))
    .slice(0, 3);
  const livePerformanceSignals = performanceSignals
    .filter(({ key }) => performance[key] !== 0)
    .map(({ key, label }) => `${label} : ${performanceLabels[performance[key]]}`);
  const missingEvidenceCriteria = getMissingEvidenceCriteria();

  function tagSupportsCriterion(tag: string, criterionKey: CriterionKey) {
    return activeFramework.tagSuggestionRules.some(
      (rule) => rule.tag === tag && rule.criteria.includes(criterionKey),
    );
  }

  function criterionHasTagEvidence(criterionKey: CriterionKey) {
    return activeTagEvidence.some(({ tag }) => tagSupportsCriterion(tag, criterionKey));
  }

  function getMissingEvidenceCriteria(): MissingEvidenceCriterion[] {
    return activeCriteria
      .filter(({ key }) => !criterionHasTagEvidence(key))
      .map(({ key, label }) => ({ key, label }));
  }

  function getCriterionTagOptions(criterionKey: CriterionKey) {
    const supportedTags = new Set(
      activeFramework.tagSuggestionRules
        .filter((rule) => rule.criteria.includes(criterionKey))
        .map((rule) => rule.tag),
    );
    const seen = new Set<string>();

    return activeQuickTagGroups.flatMap((group) =>
      group.tags.flatMap((tag) => {
        const optionKey = `${group.title}-${tag}`;

        if (!supportedTags.has(tag) || seen.has(optionKey)) {
          return [];
        }

        seen.add(optionKey);
        return [{ group, tag }];
      }),
    );
  }

  function saveDraft() {
    if (!frameworkChosen) {
      setSavedStatus("Choisissez d'abord le cadre d'évaluation avant de sauvegarder.");
      return;
    }

    const nextSession = { ...session, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...nextSession, performance }));
    setSession(nextSession);
    setSavedStatus(`Brouillon sauvegardé localement à ${new Date().toLocaleTimeString()}.`);
  }

  function loadDraft() {
    const rawDraft = localStorage.getItem(STORAGE_KEY);

    if (!rawDraft) {
      setSavedStatus("Aucun brouillon local précédent trouvé dans ce navigateur.");
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as StoredDraft;
      const normalized = normalizeSession(parsed);
      const normalizedFramework = frameworkConfigs[normalized.frameworkId];
      const normalizedStages = getFrameworkStages(normalizedFramework, normalized.cExtensionEnabled);
      const selectedStage = normalizedStages.some((stage) => stage.id === normalized.selectedStage)
        ? normalized.selectedStage
        : normalizedStages[0].id;
      setSession({ ...normalized, selectedStage });
      setFrameworkChosen(true);
      setCandidatePanelOpen(false);
      setAssessmentStarted(true);
      setViewMode("live");
      setLastLiveStage(selectedStage);
      setPerformance({ ...createEmptyPerformance(), ...parsed.performance });
      setSavedStatus("Brouillon local précédent chargé.");
    } catch {
      setSavedStatus("Le brouillon local n'a pas pu être chargé.");
    }
  }

  function clearAssessment() {
    const confirmed = window.confirm(
      "Effacer l'évaluation en cours et supprimer le brouillon local sauvegardé dans ce navigateur ?",
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    const freshSession = createSession();
    setSession(freshSession);
    setFrameworkChosen(false);
    setCandidatePanelOpen(true);
    setAssessmentStarted(false);
    setViewMode("live");
    setLastLiveStage(freshSession.selectedStage);
    setTagView("frequent");
    setPerformance(createEmptyPerformance());
    setSavedStatus("Évaluation et brouillon local effacés.");
    setCopyStatus("");
  }

  function generateSummary() {
    if (!session.notes.finalJudgment.trim()) {
      setCopyStatus("Complétez d'abord l'évaluation finale avant de générer le résumé.");
      return;
    }

    const level = finalLevel || "[Niveau final à confirmer]";
    const confirmedLevel = isFrameworkLevel(level, activeFramework) ? level : "";
    const comments =
      confirmedLevel
        ? activeFramework.reportTemplates[confirmedLevel] ?? ""
        : "La personne candidate peut gérer des échanges oraux simples et familiers en français, avec soutien. La performance doit être interprétée avec prudence si les preuves observées sont limitées.";
    const recommendations = getRecommendations(confirmedLevel, activeFramework).map((item) => `- ${item}`).join("\n");
    const criterionLines = activeCriteria
      .map(({ key, label }) => `- ${label} : ${session.ratings[key] || "[non sélectionné]"}`)
      .join("\n");
    const performanceLines = performanceSignals
      .filter(({ key }) => performance[key] !== 0)
      .map(({ key, label }) => `- ${label} : ${performanceLabels[performance[key]]}`)
      .join("\n");
    const performanceSection = performanceLines
      ? `\nRepères d'observation pendant l'entretien :\n${performanceLines}\n`
      : "";
    const coherenceLine = coherenceAlert
      ? `\nPoint de cohérence à vérifier :\n${coherenceAlert}\n`
      : "";
    const disclaimerLine = activeFramework.disclaimer ? `\nNote importante :\n${activeFramework.disclaimer}\n` : "";
    const trainingEstimateLine =
      activeFramework.id === "pfl2-sle"
        ? `\n${getPfl2TrainingEstimate(session.trainingEstimate, confirmedLevel).reportText}\n`
        : "";

    const generated = `Personne candidate :
${session.candidate.fullName || "[Nom complet de la personne candidate]"}

Courriel :
${session.candidate.email || "[Courriel de la personne candidate]"}

Type d'évaluation :
${session.candidate.assessmentType} - ${session.candidate.assessmentLanguage}

Date de l'évaluation :
${session.candidate.assessmentDate || "[Date de l'évaluation]"}

Client :
${session.candidate.client}

Évaluateur / évaluatrice :
${session.candidate.evaluatorName || "[Nom de l'évaluateur ou de l'évaluatrice]"}

${activeFramework.finalProfileLabel} :
${level}
${disclaimerLine}
${trainingEstimateLine}

Observations par critère :
${criterionLines}
${performanceSection}${coherenceLine}
Forces observées :
${session.notes.strengths || "[Ajouter les forces observées pendant l'évaluation orale.]"}

Défis observés :
${session.notes.challenges || "[Ajouter les défis observés pendant l'évaluation orale.]"}

Observations linguistiques précises :
${session.notes.preciseErrors || "[Ajouter les erreurs linguistiques précises et des exemples représentatifs.]"}

Commentaires fondés sur les preuves :
${session.notes.generalObservations || "[Ajouter les observations générales issues de l'évaluation en direct.]"}

Exemples de performance forte :
${session.notes.strongPerformanceExamples || "[Ajouter des exemples de performance forte.]"}

Commentaire global d'évaluation :
${session.notes.finalJudgment || comments}

Recommandations :
${recommendations}`;

    setSession((current) => ({
      ...current,
      summary: generated,
      selectedStage: "final",
      updatedAt: new Date().toISOString(),
    }));
    setViewMode("finalize");
    setCopyStatus("");
  }

  async function copySummary() {
    if (!session.summary) {
      return;
    }

    try {
      await navigator.clipboard.writeText(session.summary);
      setCopyStatus("Résumé copié dans le presse-papiers.");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = session.summary;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyStatus(copied ? "Résumé copié dans le presse-papiers." : "Copie bloquée par le navigateur.");
    }

    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function startAssessment() {
    if (!frameworkChosen) {
      setSavedStatus("Choisissez d'abord le cadre d'évaluation avant de commencer.");
      return;
    }

    setCandidatePanelOpen(false);
    setAssessmentStarted(true);
    setViewMode("live");
    setSavedStatus("Sauvegarde automatique active.");
    setSession((current) => ({
      ...current,
      selectedStage: current.selectedStage || activeStages[0].id,
      updatedAt: new Date().toISOString(),
    }));
  }

  function requestFinalizeMode() {
    if (missingEvidenceCriteria.length > 0) {
      setEvidenceReminderCriteria(missingEvidenceCriteria);
      setShowEvidenceReminder(true);
      return;
    }

    switchToFinalizeMode();
  }

  function closeEvidenceReminder() {
    setShowEvidenceReminder(false);
    setEvidenceReminderCriteria([]);
  }

  function switchToFinalizeMode() {
    setShowEvidenceReminder(false);
    setEvidenceReminderCriteria([]);
    setCandidatePanelOpen(false);
    setViewMode("finalize");
    setLastLiveStage((current) => (session.selectedStage === "final" ? current : session.selectedStage));
    setSession((current) => ({
      ...current,
      selectedStage: "final",
      updatedAt: new Date().toISOString(),
    }));

    window.setTimeout(() => {
      document.querySelector(".ratingSection")?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 0);
  }

  function returnToLiveMode() {
    setCandidatePanelOpen(false);
    setViewMode("live");
    setSession((current) => ({
      ...current,
      selectedStage: current.selectedStage === "final" ? lastLiveStage : current.selectedStage,
      updatedAt: new Date().toISOString(),
    }));

    window.setTimeout(() => {
      document.querySelector(".stagePanel")?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 0);
  }

  function goToNextStage() {
    if (!nextStage) {
      return;
    }

    selectStage(nextStage.id);
  }

  function cyclePerformanceSignal(key: PerformanceKey) {
    setPerformance((current) => ({
      ...current,
      [key]: (((current[key] + 1) % 4) as PerformanceValue),
    }));
  }

  function addReportPhrase(phrase: string) {
    const currentText = session.notes.finalJudgment.trim();

    if (currentText.includes(phrase)) {
      return;
    }

    updateNote("finalJudgment", [currentText, phrase].filter(Boolean).join("\n"));
  }

  function isReportPhraseSelected(phrase: string) {
    return session.notes.finalJudgment.includes(phrase);
  }

  function confirmCriterionSuggestion(key: CriterionKey) {
    const suggestion = criterionSuggestions[key];

    if (!suggestion.level) {
      return;
    }

    updateRating(key, suggestion.level);
  }

  function confirmAllCriterionSuggestions() {
    setSession((current) => {
      const nextRatings = { ...current.ratings };

      activeCriteria.forEach(({ key }) => {
        const suggestion = criterionSuggestions[key];

        if (suggestion.level) {
          nextRatings[key] = suggestion.level;
        }
      });

      return {
        ...current,
        ratings: nextRatings,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function validateSuggestedFinalLevel() {
    if (!suggestedLevel) {
      return;
    }

    updateRating("finalLevel", suggestedLevel);
    scrollAfterFinalLevelSelection(suggestedLevel);
  }

  function handleFinalLevelChange(value: AssessmentLevel | "") {
    updateRating("finalLevel", value);

    if (value) {
      scrollAfterFinalLevelSelection(value);
    }
  }

  function scrollAfterFinalLevelSelection(level: AssessmentLevel) {
    const nextCoherenceAlert = getCoherenceAlert(level, suggestedLevel, tagStats, activeFramework);
    const selector = nextCoherenceAlert
      ? ".coherenceAlert"
      : activeFramework.id === "pfl2-sle"
        ? ".trainingEstimatePanel"
        : ".phraseBankPanel";
    const block: ScrollLogicalPosition = nextCoherenceAlert ? "center" : "start";

    window.setTimeout(() => {
      document.querySelector(selector)?.scrollIntoView({ block, behavior: "auto" });
    }, 0);
  }

  function changeFramework(frameworkId: FrameworkId) {
    if (assessmentStarted) {
      return;
    }

    const config = frameworkConfigs[frameworkId];
    const firstStage = getFrameworkStages(config, false)[0].id;

    setFrameworkChosen(true);
    setSession((current) => ({
      ...current,
      frameworkId,
      candidate: {
        ...current.candidate,
        client: config.defaultClient,
      },
      ratings: createEmptyRatings(),
      notes: createEmptyNotes(),
      selectedStage: firstStage,
      summary: "",
      cExtensionEnabled: false,
      trainingEstimate: { ...defaultTrainingEstimate },
      updatedAt: new Date().toISOString(),
    }));
    setLastLiveStage(firstStage);
    setTagView("frequent");
    setPerformance(createEmptyPerformance());
    setCopyStatus("");
  }

  function toggleCExtension() {
    setSession((current) => {
      const nextEnabled = !current.cExtensionEnabled;
      const config = frameworkConfigs[current.frameworkId ?? "cefr-ccc"];
      const nextStages = getFrameworkStages(config, nextEnabled);
      const selectedStage = nextStages.some((stage) => stage.id === current.selectedStage)
        ? current.selectedStage
        : nextStages[0].id;

      return {
        ...current,
        cExtensionEnabled: nextEnabled,
        selectedStage,
        updatedAt: new Date().toISOString(),
      };
    });
  }

  return (
    <div className="appShell">
      <header className="topHeader">
        <div className="brandBlock">
          <img className="brandLogo" src={`${import.meta.env.BASE_URL}kc-logo.png`} alt="Knowledge Circle" />
          <div>
            <p className="eyebrow">Outil interne d'évaluation Knowledge Circle</p>
            <h1>{frameworkChosen ? activeFramework.appTitle : "Console d'évaluation orale KC"}</h1>
          </div>
        </div>
        <div className="headerMeta" aria-label="État de l'évaluation en cours">
          <label className={assessmentStarted ? "frameworkSelect locked" : "frameworkSelect"}>
            <Layers size={16} aria-hidden="true" />
            <span>Cadre</span>
            <select
              aria-label="Cadre d'évaluation"
              value={frameworkChosen ? activeFramework.id : ""}
              disabled={assessmentStarted}
              onChange={(event) => changeFramework(event.target.value as FrameworkId)}
            >
              <option value="" disabled>
                Choisir un cadre
              </option>
              {Object.values(frameworkConfigs).map((config) => (
                <option key={config.id} value={config.id}>
                  {config.selectorLabel}
                </option>
              ))}
            </select>
          </label>
          {assessmentStarted ? (
            <span className="frameworkStatus locked">Cadre verrouillé</span>
          ) : frameworkChosen ? (
            <span className="frameworkStatus ready">Cadre choisi</span>
          ) : null}
          <span>Mode: {frameworkChosen ? activeFramework.modeLabel : "À choisir"}</span>
          <span>{frameworkChosen ? session.candidate.client : "Cadre à choisir"}</span>
          <span>{session.candidate.assessmentLanguage} - interaction orale</span>
          <span>{session.candidate.fullName || "Nouvelle personne candidate"}</span>
          <span>{session.candidate.assessmentDate}</span>
          <span className="timer">
            <Clock size={15} aria-hidden="true" />
            {formatElapsed(elapsedSeconds)}
          </span>
          <button className="headerHelpButton" onClick={() => setShowGuidePage(true)} type="button">
            <HelpCircle size={15} aria-hidden="true" />
            Aide
          </button>
        </div>
      </header>

      {!frameworkChosen && !showGuidePage ? (
        <div className="frameworkModalOverlay" role="dialog" aria-modal="true" aria-labelledby="frameworkModalTitle">
          <section className="frameworkModal">
            <div className="frameworkModalIcon" aria-hidden="true">
              <Layers size={22} />
            </div>
            <div className="frameworkModalIntro">
              <p className="eyebrow">Première étape</p>
              <h2 id="frameworkModalTitle">Choisir le cadre d'évaluation</h2>
              <p>
                Sélectionnez le cadre avant de remplir l'évaluation. Ce choix sera verrouillé pendant l'entretien
                afin d'éviter tout mélange de niveaux, de tags ou de critères.
              </p>
            </div>
            <div className="frameworkChoiceGrid">
              {Object.values(frameworkConfigs).map((config) => (
                <button className="frameworkChoiceButton" key={config.id} onClick={() => changeFramework(config.id)} type="button">
                  <strong>{config.selectorLabel}</strong>
                  <span>
                    {config.id === "cefr-ccc"
                      ? "Rapport CCC avec niveaux CECR/CEFR."
                      : "Profil interne PFL2 / SLE avec niveaux A-C."}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {showEvidenceReminder && !showGuidePage ? (
        <div className="evidenceReminderOverlay" role="dialog" aria-modal="true" aria-labelledby="evidenceReminderTitle">
          <section className="evidenceReminderModal">
            <div className="evidenceReminderHeader">
              <div>
                <p className="eyebrow">Contrôle avant finalisation</p>
                <h2 id="evidenceReminderTitle">Compléter les preuves par compétence</h2>
                <p>
                  Certaines compétences n'ont pas encore de tag associé. Ajoutez les tags utiles ci-dessous ou finalisez
                  quand même si vos notes couvrent déjà ces éléments.
                </p>
              </div>
              <button className="secondaryButton" onClick={closeEvidenceReminder} type="button">
                Retour aux tags
              </button>
            </div>

            <div className="missingEvidenceList">
              {evidenceReminderCriteria.length ? (
                evidenceReminderCriteria.map((criterion) => {
                  const options = getCriterionTagOptions(criterion.key);
                  const hasEvidence = criterionHasTagEvidence(criterion.key);

                  return (
                    <section className={hasEvidence ? "missingEvidenceItem hasEvidence" : "missingEvidenceItem"} key={criterion.key}>
                      <div>
                        <h3>{hasEvidence ? "Preuve ajoutée pour" : "Aucun tag pour"} {criterion.label}</h3>
                        <p>
                          Cliquez une fois pour ajouter, une deuxième fois pour marquer une preuve forte (+), une
                          troisième fois pour retirer le tag.
                        </p>
                      </div>
                      <div className="missingEvidenceTags">
                        {options.length ? (
                          options.slice(0, 10).map(({ group, tag }) => {
                            const tagState = getTagState(group, tag);
                            const active = tagState !== "inactive";

                            return (
                              <button
                                aria-pressed={active}
                                className={[
                                  "tagButton",
                                  "evidenceReminderTag",
                                  active ? "active" : "",
                                  tagState === "strong" ? "strong" : "",
                                ].join(" ")}
                                key={`${criterion.key}-${group.title}-${tag}`}
                                onClick={() => toggleTag(group, tag)}
                                type="button"
                              >
                                {getTagLabel(tag, activeFramework)}{tagState === "strong" ? " +" : ""}
                                <small>{getGroupShortLabel(group)}</small>
                              </button>
                            );
                          })
                        ) : (
                          <p className="missingEvidenceEmpty">
                            Aucun tag direct n'est configuré pour cette compétence. Utilisez vos notes ou le fil
                            conducteur.
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })
              ) : (
                <section className="missingEvidenceItem complete">
                  <h3>Toutes les compétences ont au moins une preuve par tag.</h3>
                  <p>Vous pouvez passer à la grille d'évaluation.</p>
                </section>
              )}
            </div>

            <div className="evidenceReminderActions">
              <button className="secondaryButton" onClick={closeEvidenceReminder} type="button">
                Continuer l'entretien
              </button>
              <button className="primaryButton" onClick={switchToFinalizeMode} type="button">
                Finaliser quand même
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showGuidePage ? (
        <main className="guidePageShell">
          <EvaluatorGuidePage framework={activeFramework} onClose={() => setShowGuidePage(false)} />
        </main>
      ) : (
      <main
        className={[
          "layout",
          assessmentStarted ? "" : "setupMode",
          assessmentStarted && viewMode === "live" ? "liveMode" : "",
          assessmentStarted && viewMode === "finalize" ? "finalizeMode" : "",
        ].join(" ")}
      >
        <nav className="stageRail" aria-label="Étapes de l'évaluation">
          <div className="railTitle">Étapes</div>
          {visibleStages.map((stage) => {
            const isActiveStage = stage.id === session.selectedStage && assessmentStarted;

            return (
              <React.Fragment key={stage.id}>
                <button
                  className={[
                    isActiveStage ? "stageButton active" : "stageButton",
                    !assessmentStarted ? "disabled" : "",
                  ].join(" ")}
                  disabled={!assessmentStarted}
                  onClick={() => selectStage(stage.id)}
                >
                  <span>{stage.label}</span>
                  {stage.title}
                  <small>{stage.time}</small>
                </button>
                {isActiveStage ? (
                  <div className="railGuidance" aria-label="Consignes et points d'observation de l'étape active">
                    <RailInfoBlock title="Consignes / objectif" items={selectedStage.purpose} />
                    <RailInfoBlock title="Points d'observation" items={selectedStage.focus} />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
          {assessmentStarted && activeFramework.id === "pfl2-sle" ? (
            <button className="cExtensionButton" onClick={toggleCExtension} type="button">
              {session.cExtensionEnabled ? "Désactiver l'extension niveau C" : "Activer l'extension niveau C"}
              <small>{session.cExtensionEnabled ? "Étape 7 visible" : "Au besoin seulement"}</small>
            </button>
          ) : null}
        </nav>

        <section className="centerColumn">
          <section className={candidatePanelOpen ? "panel assessmentPanel" : "panel assessmentPanel collapsed"}>
            <div className="panelHeader">
              <div>
                <h2>Renseignements de l'évaluation</h2>
                <p>
                  {candidatePanelOpen
                    ? "Entrez les informations de départ, puis passez en mode évaluation."
                    : "Résumé de la séance. Le travail principal se fait maintenant dans les étapes ci-dessous."}
                </p>
              </div>
              <div className="actionRow">
                <button className="secondaryButton" onClick={loadDraft}>
                  <RotateCcw size={16} aria-hidden="true" />
                  Charger
                </button>
                <button className="secondaryButton" onClick={saveDraft}>
                  <Save size={16} aria-hidden="true" />
                  Sauvegarder
                </button>
                {assessmentStarted ? (
                  <div className="modeSwitch" aria-label="Mode de travail">
                    <button
                      className={viewMode === "live" ? "modeButton active" : "modeButton"}
                      onClick={returnToLiveMode}
                      type="button"
                    >
                      Entretien
                    </button>
                    <button
                      className={viewMode === "finalize" ? "modeButton active" : "modeButton"}
                      onClick={requestFinalizeMode}
                      type="button"
                    >
                      Finaliser
                    </button>
                  </div>
                ) : null}
                {candidatePanelOpen ? (
                  <button
                    className="primaryButton"
                    onClick={startAssessment}
                    disabled={!frameworkChosen}
                  >
                    Passer à l'évaluation
                  </button>
                ) : (
                  <button className="secondaryButton" onClick={() => setCandidatePanelOpen(true)}>
                    Modifier les infos
                  </button>
                )}
                <button className="dangerButton" onClick={clearAssessment}>
                  <Trash2 size={16} aria-hidden="true" />
                  Effacer
                </button>
              </div>
            </div>
            {candidatePanelOpen ? (
              <>
                <div className="formGrid">
                  <TextField
                    label="Nom complet"
                    value={session.candidate.fullName}
                    onChange={(value) => updateCandidate("fullName", value)}
                  />
                  <TextField
                    label="Courriel"
                    value={session.candidate.email}
                    type="email"
                    onChange={(value) => updateCandidate("email", value)}
                  />
                  <TextField
                    label="Date de l'évaluation"
                    value={session.candidate.assessmentDate}
                    type="date"
                    onChange={(value) => updateCandidate("assessmentDate", value)}
                  />
                  <TextField label="Client" value={frameworkChosen ? session.candidate.client : "À choisir selon le cadre"} readOnly />
                  <TextField label="Langue d'évaluation" value={session.candidate.assessmentLanguage} readOnly />
                  <TextField label="Type d'évaluation" value={session.candidate.assessmentType} readOnly />
                  <TextField
                    label="Nom de l'évaluateur"
                    value={session.candidate.evaluatorName}
                    onChange={(value) => updateCandidate("evaluatorName", value)}
                  />
                  <TextField label="Mode d'évaluation" value={session.candidate.mode} readOnly />
                  <TextField
                    label="Niveau cible, optionnel"
                    value={session.candidate.targetLevel ?? ""}
                    onChange={(value) => updateCandidate("targetLevel", value)}
                  />
                  <TextField
                    label="Poste / contexte, optionnel"
                    value={session.candidate.positionContext ?? ""}
                    onChange={(value) => updateCandidate("positionContext", value)}
                    wide
                  />
                  <label className="field wide">
                    <span>Notes avant l'évaluation, optionnel</span>
                    <textarea
                      className="shortTextarea"
                      value={session.candidate.preAssessmentNotes ?? ""}
                      onChange={(event) => updateCandidate("preAssessmentNotes", event.target.value)}
                    />
                  </label>
                </div>
                <p className="saveStatus">{savedStatus}</p>
              </>
            ) : (
              <div className="assessmentSummaryBar">
                <span>
                  <strong>Personne candidate</strong>
                  {session.candidate.fullName || "Non indiqué"}
                </span>
                <span>
                  <strong>Date</strong>
                  {session.candidate.assessmentDate}
                </span>
                <span>
                  <strong>Évaluateur</strong>
                  {session.candidate.evaluatorName || "Non indiqué"}
                </span>
                <span>
                  <strong>Format</strong>
                  {session.candidate.assessmentLanguage} · {session.candidate.assessmentType}
                </span>
              </div>
            )}
          </section>

          {assessmentStarted ? (
            <>
              {viewMode === "live" ? (
                <section className="panel liveToolbar" aria-label="Commandes rapides pendant l'entretien">
                  <div className="liveToolbarMain">
                    <div>
                      <p className="eyebrow">Mode entretien</p>
                      <h2>
                        {selectedStage.label} · {selectedStage.title}
                      </h2>
                      <p>{activeFramework.modeLabel} · {savedStatus}</p>
                    </div>
                    <div className="liveActions">
                      <button className="secondaryButton" disabled={!nextStage} onClick={goToNextStage} type="button">
                        Étape suivante
                      </button>
                      <button className="primaryButton" onClick={requestFinalizeMode} type="button">
                        Finaliser
                      </button>
                    </div>
                  </div>

                  <div className="stepProgress" aria-label="Progression de l'entretien">
                    {activeStages.map((stage, index) => (
                      <button
                        aria-current={stage.id === selectedStage.id ? "step" : undefined}
                        className={[
                          "progressDot",
                          stage.id === selectedStage.id ? "active" : "",
                          index < liveStageIndex ? "complete" : "",
                        ].join(" ")}
                        key={stage.id}
                        onClick={() => selectStage(stage.id)}
                        title={stage.title}
                        type="button"
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <EvidenceSummaryStrip
                    challengeTags={liveChallengeTags}
                    performanceItems={livePerformanceSignals}
                    strengthTags={liveStrengthTags}
                    suggestedLevel={suggestedLevel}
                  />
                </section>
              ) : null}

              <section className="panel stagePanel">
                <div className="panelHeader">
                  <div>
                    <p className="eyebrow">{selectedStage.label}</p>
                    <h2>{selectedStage.title}</h2>
                  </div>
                  <span className="timeBadge">{selectedStage.time}</span>
                </div>
                <div className="stageContent">
                  <div className="questionsColumn">
                    <PromptBlock
                      title="Questions principales / tâche"
                      items={selectedStage.main}
                      emphasis
                      wide
                    />
                    {selectedStage.alternatives ? (
                      <PromptBlock title="Scénarios de rechange" items={selectedStage.alternatives} />
                    ) : null}
                    {selectedStage.easier ? (
                      <PromptBlock title="Options plus faciles" items={selectedStage.easier} />
                    ) : null}
                    {selectedStage.advanced ? (
                      <PromptBlock title="Options plus avancées" items={selectedStage.advanced} />
                    ) : null}
                    {selectedStage.followUps ? (
                      <PromptBlock title="Relances possibles pendant cette étape" items={selectedStage.followUps} />
                    ) : null}
                    {selectedStage.deepening ? (
                      <PromptBlock
                        title="Relances d'approfondissement au besoin"
                        items={selectedStage.deepening}
                      />
                    ) : null}
                    {shouldPromptCProbe ? <CProbePanel probes={cProbeQuestions} /> : null}
                  </div>
                </div>
              </section>

              <section className="panel notesPanel">
                <div className="panelHeader">
                  <div>
                    <h2>Notes structurées</h2>
                    <p>Les champs marqués “Tags rapides” se remplissent depuis le panneau de droite. Les champs “manuel” sont à compléter par l'évaluateur.</p>
                  </div>
                </div>
                <div className="notesGrid">
                  {structuredNoteFields.map((field) => (
                    <label className={`noteField ${field.mode === "auto" ? "autoNote" : "manualNote"}`} key={field.key}>
                      <span>
                        {field.label}
                        <small>{field.mode === "auto" ? "Tags rapides" : "Manuel"}</small>
                      </span>
                      <em>{field.helper}</em>
                      <textarea
                        value={session.notes[field.key]}
                        placeholder={field.placeholder}
                        onChange={(event) => updateNote(field.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </section>

              {viewMode === "finalize" ? (
                <section className="panel evidenceSummaryPanel">
                  <div className="panelHeader">
                    <div>
                      <p className="eyebrow">Avant la grille</p>
                      <h2>Synthèse rapide des observations</h2>
                      <p>Résumé automatique des tags et des repères d'observation pour guider la cotation finale.</p>
                    </div>
                  </div>
                  <EvidenceSummaryStrip
                    challengeTags={liveChallengeTags}
                    performanceItems={livePerformanceSignals}
                    strengthTags={liveStrengthTags}
                    suggestedLevel={suggestedLevel}
                  />
                </section>
              ) : null}

              <section className="panel ratingSection" aria-label={activeFramework.ratingAriaLabel}>
                <div className="panelHeader">
                  <div>
                    <p className="eyebrow">Après l'entretien</p>
                    <h2>{activeFramework.ratingTitle}</h2>
                    <p>{activeFramework.ratingHelp}</p>
                  </div>
                  <div className="actionRow">
                    <button
                      className="secondaryButton"
                      disabled={!evidenceSuggestedLevel}
                      onClick={confirmAllCriterionSuggestions}
                      type="button"
                    >
                      Confirmer les suggestions
                    </button>
                  </div>
                </div>

                <div className="ratingList">
                  {activeCriteria.map((criterion) => {
                    const value = session.ratings[criterion.key];
                    const suggestion = criterionSuggestions[criterion.key];
                    const hasSuggestion = Boolean(suggestion.level);
                    const displayedValue = value || suggestion.level || "";
                    const suggestionState = !hasSuggestion
                      ? ""
                      : value === suggestion.level
                        ? "confirmed"
                        : value
                          ? "modified"
                          : "suggested";

                    return (
                      <div className={`ratingField ${suggestionState}`} key={criterion.key}>
                        <span>{criterion.label}</span>
                        <select
                          aria-label={criterion.label}
                          value={displayedValue}
                          onChange={(event) => updateRating(criterion.key, event.target.value as AssessmentLevel | "")}
                        >
                          <option value="">Sélectionner</option>
                          {activeLevels.map((level) => (
                            <option key={level} value={level}>
                              {level}
                            </option>
                          ))}
                        </select>
                        {hasSuggestion ? (
                          <div className="criterionSuggestion">
                            <div>
                              <strong>Suggéré : {suggestion.level}</strong>
                              <span>
                                {suggestionState === "confirmed"
                                  ? "Confirmé"
                                  : suggestionState === "modified"
                                    ? "Modifié par l'évaluateur"
                                    : "À confirmer"}
                              </span>
                            </div>
                            <p>{suggestion.reasons.join("; ")}</p>
                            {suggestionState === "suggested" ? (
                              <button type="button" onClick={() => confirmCriterionSuggestion(criterion.key)}>
                                Confirmer
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="criterionSuggestion empty">
                            <strong>Aucune suggestion</strong>
                            <p>Ajoutez des tags ou utilisez les repères d'observation pour générer une piste.</p>
                          </div>
                        )}
                        <small>
                          {displayedValue
                            ? activeFramework.descriptors[criterion.key][displayedValue] ?? "Descripteur à confirmer pour ce critère."
                            : "Sélectionnez un niveau pour afficher le descripteur."}
                        </small>
                      </div>
                    );
                  })}
                </div>

                <div className="postInterviewFooter">
                  <div className="suggestionBox">
                    <span>Niveau suggéré</span>
                    <strong>{suggestedLevel || "Cotes insuffisantes"}</strong>
                    <p>{ratingSuggestedLevel ? "Niveau suggéré selon les cotes confirmées." : "Niveau suggéré à partir des tags rapides et des repères d'observation."} Le niveau final doit être confirmé par l'évaluateur ou l'évaluatrice.</p>
                    <p>Suggestion basée sur les observations sélectionnées. Le niveau final doit être confirmé par l'évaluateur ou l'évaluatrice.</p>
                  </div>
                  {coherenceAlert ? (
                    <div className="coherenceAlert" role="alert" aria-live="polite">
                      <div className="coherenceAlertIcon" aria-hidden="true">
                        <AlertTriangle size={20} strokeWidth={2.4} />
                      </div>
                      <div className="coherenceAlertContent">
                        <span>Écart important détecté</span>
                        <div className="coherenceLevelLine" aria-label="Écart entre le niveau suggéré et le niveau final choisi">
                          <strong>Suggéré : {suggestedLevel || "à confirmer"}</strong>
                          <b aria-hidden="true">→</b>
                          <strong>Choisi : {session.ratings.finalLevel}</strong>
                        </div>
                        <p>{coherenceAlert}</p>
                        <small>Si ce choix est volontaire, ajoutez une justification courte dans l'évaluation finale.</small>
                      </div>
                    </div>
                  ) : null}

                  <label className="ratingField finalLevel">
                    <span>Niveau final recommandé</span>
                    <select
                      aria-label="Niveau final recommandé"
                      value={session.ratings.finalLevel}
                      onChange={(event) => handleFinalLevelChange(event.target.value as AssessmentLevel | "")}
                    >
                      <option value="">Choisir / valider le niveau final</option>
                      {activeLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <small>
                      {hasValidatedFinalLevel
                        ? "Niveau final validé. La banque d'évaluation finale est maintenant disponible."
                        : "Validez le niveau final pour afficher la banque d'évaluation finale."}
                    </small>
                    {!hasValidatedFinalLevel && suggestedLevel ? (
                      <button type="button" onClick={validateSuggestedFinalLevel}>
                        Valider le niveau suggéré ({suggestedLevel})
                      </button>
                    ) : null}
                  </label>
                </div>
              </section>

              {hasValidatedFinalLevel ? (
                <>
                  {showTrainingEstimatePanel ? (
                    <section className="panel trainingEstimatePanel" aria-label="Estimation indicative de parcours PFL2">
                      <div className="panelHeader">
                        <div>
                          <p className="eyebrow">PFL2 / SLE</p>
                          <h2>Estimation indicative de parcours</h2>
                          <p>
                            Ajoutez au rapport une projection prudente vers B et C. L'estimation reste indicative et
                            doit être interprétée par l'évaluateur ou l'évaluatrice.
                          </p>
                        </div>
                      </div>

                      <div className="trainingEstimateGrid">
                        <label className="ratingField">
                          <span>Mode d'estimation</span>
                          <select
                            aria-label="Mode d'estimation de parcours PFL2"
                            value={session.trainingEstimate.mode}
                            onChange={(event) =>
                              updateTrainingEstimate({
                                mode: event.target.value as TrainingEstimateMode,
                                point: event.target.value === "of" ? session.trainingEstimate.point : "",
                              })
                            }
                          >
                            <option value="auto">Automatique par niveau final</option>
                            <option value="of">Préciser le point OF</option>
                            <option value="none">Ne pas inclure d'estimation</option>
                          </select>
                          <small>
                            Le mode automatique utilise le niveau final. Le point OF permet une estimation plus précise.
                          </small>
                        </label>

                        {session.trainingEstimate.mode === "of" ? (
                          <label className="ratingField">
                            <span>Point de départ estimé</span>
                            <select
                              aria-label="Point de départ OF estimé"
                              value={session.trainingEstimate.point}
                              onChange={(event) => updateTrainingEstimate({ point: event.target.value })}
                            >
                              <option value="">Choisir un point OF</option>
                              {pfl2OfTrainingEstimates.map((item) => (
                                <option key={item.point} value={item.point}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                            <small>Utilisez ce choix seulement si l'entretien permet de situer le point OF avec confiance.</small>
                          </label>
                        ) : null}

                        <div className="trainingEstimatePreview">
                          <span>Aperçu rapportable</span>
                          <strong>{trainingEstimate.title}</strong>
                          {trainingEstimate.lines.map((line) => (
                            <p key={line}>{line}</p>
                          ))}
                          {session.trainingEstimate.mode !== "none" ? (
                            <small>
                              Les durées proviennent des repères PFL2/CSPS du document fourni et restent indicatives.
                            </small>
                          ) : null}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <section className="panel phraseBankPanel" aria-label="Banque de formulations rapportables">
                    <div className="phraseBank">
                      <div>
                        <p className="eyebrow">Banque d'évaluation finale</p>
                        <h2>Formulations modulaires</h2>
                        <p>
                          Cliquez pour ajouter une formulation à l'évaluation finale. Le texte reste modifiable par
                          l'évaluateur.
                        </p>
                        <p>
                          La banque sert de point de départ uniforme : choisissez une ou plusieurs formulations, puis
                          adaptez le texte dans le champ ci-dessous avec les preuves propres à la personne candidate.
                        </p>
                      </div>
                      <div className="phraseGrid">
                        {judgmentPhraseOptions.map((phrase) => {
                          const selected = isReportPhraseSelected(phrase.text);

                          return (
                            <button
                              className={selected ? "selected" : ""}
                              disabled={selected}
                              key={phrase.id}
                              onClick={() => addReportPhrase(phrase.text)}
                              type="button"
                            >
                              <span>{selected ? "Ajouté" : phrase.category}</span>
                              <strong>{phrase.title}</strong>
                              {phrase.text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <section className="panel finalJudgmentPanel">
                    <div className="panelHeader">
                      <div>
                        <p className="eyebrow">Évaluation finale</p>
                        <h2>Texte retenu pour le rapport</h2>
                        <p>Le texte choisi dans la banque apparaît ici et peut être adapté au cas de la personne candidate.</p>
                      </div>
                    </div>
                    <label className="noteField manualNote finalJudgmentField">
                      <span>
                        Évaluation finale de l'évaluateur
                        <small>Manuel</small>
                      </span>
                      <em>Complétez ou adaptez l'évaluation finale avant de générer le résumé.</em>
                      <textarea
                        value={session.notes.finalJudgment}
                        placeholder="Choisissez une formulation dans la banque ou rédigez l'évaluation finale..."
                        onChange={(event) => updateNote("finalJudgment", event.target.value)}
                      />
                    </label>
                  </section>
                </>
              ) : (
                <section className="panel finalLevelGate">
                  <p className="eyebrow">Prochaine étape</p>
                  <h2>Valider le niveau final</h2>
                  <p>La banque d'évaluation finale apparaîtra après la validation du niveau final recommandé.</p>
                </section>
              )}

              {hasValidatedFinalLevel ? (
              <section className="panel summaryPanel">
                <div className="panelHeader">
                  <div>
                    <h2>{activeFramework.summaryTitle}</h2>
                    <p>Modifiez le texte généré avant de le copier dans le {activeFramework.summaryReportTarget}.</p>
                  </div>
                  <div className="actionRow">
                    <button className="primaryButton" disabled={!hasFinalJudgment} onClick={generateSummary}>
                      <Sparkles size={17} aria-hidden="true" />
                      {activeFramework.summaryButtonLabel}
                    </button>
                    <button className="secondaryButton" onClick={copySummary} disabled={!session.summary}>
                      <Clipboard size={16} aria-hidden="true" />
                      Copier
                    </button>
                  </div>
                </div>
                <textarea
                  className="summaryTextarea"
                  value={session.summary}
                  placeholder={
                    hasFinalJudgment
                      ? activeFramework.summaryPlaceholder
                      : "Complétez d'abord l'évaluation finale pour activer la génération du résumé."
                  }
                  onChange={(event) =>
                    setSession((current) => ({
                      ...current,
                      summary: event.target.value,
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                />
                {copyStatus ? <p className="copyStatus">{copyStatus}</p> : null}
              </section>
              ) : null}
            </>
          ) : null}
        </section>

        {assessmentStarted ? <aside className="tagPanel" aria-label="Tags rapides de prise de notes">
          <section className="panel stickyPanel">
            <div className="panelHeader compact">
              <div>
                <p className="eyebrow">Pendant l'entretien</p>
                <h2>Tags rapides</h2>
                <p className="tagCount">{selectedTagCount} tag{selectedTagCount > 1 ? "s" : ""} sélectionné{selectedTagCount > 1 ? "s" : ""}</p>
              </div>
              {viewMode === "finalize" ? (
                <button className="returnLiveButton" onClick={returnToLiveMode} type="button">
                  Retour à l'entretien
                </button>
              ) : null}
            </div>

            <div className="tagTabs" role="tablist" aria-label="Filtres de tags rapides">
              {tagViews.map((view) => (
                <button
                  aria-selected={tagView === view.key}
                  className={tagView === view.key ? "tagTab active" : "tagTab"}
                  key={view.key}
                  onClick={() => setTagView(view.key)}
                  role="tab"
                  type="button"
                >
                  {view.label}
                </button>
              ))}
            </div>

            {tagView === "frequent" ? (
              <div className="frequentTagGrid">
                {frequentTagActions.map(({ group, tag }) => {
                  const tagState = getTagState(group, tag);
                  const active = tagState !== "inactive";

                  return (
                    <button
                      aria-pressed={active}
                      className={[
                        "tagButton quick",
                        group.tone,
                        active ? "active" : "",
                        tagState === "strong" ? "strong" : "",
                      ].join(" ")}
                      key={`${group.title}-${tag}`}
                      onClick={() => toggleTag(group, tag)}
                      title={`${group.title} : ${tag}`}
                      type="button"
                    >
                      <span>{getTagLabel(tag, activeFramework)}</span>
                      <small>{tagState === "strong" ? `${getGroupShortLabel(group)} +` : getGroupShortLabel(group)}</small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="tagGrid">
                {visibleTagGroups.map((group) => (
                  <div className={`tagGroup ${group.tone}`} key={group.title}>
                    <h3>{group.title}</h3>
                    <div>
                      {group.tags.map((tag) => {
                        const tagState = getTagState(group, tag);
                        const active = tagState !== "inactive";

                        return (
                          <button
                            aria-pressed={active}
                            className={[
                              "tagButton",
                              active ? "active" : "",
                              tagState === "strong" ? "strong" : "",
                            ].join(" ")}
                            key={tag}
                            onClick={() => toggleTag(group, tag)}
                            title={tag}
                            type="button"
                          >
                            {getTagLabel(tag, activeFramework)}{tagState === "strong" ? " +" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <section className="performanceRail" aria-label="Repères d'observation de performance">
              <h3>Repères d'observation</h3>
              <div className="signalGrid">
                {performanceSignals.map((signal) => (
                  <button
                    className={`signalButton level${performance[signal.key]}`}
                    key={signal.key}
                    onClick={() => cyclePerformanceSignal(signal.key)}
                    type="button"
                  >
                    <span>{signal.label}</span>
                    <strong>{performanceLabels[performance[signal.key]]}</strong>
                  </button>
                ))}
              </div>
            </section>
          </section>
        </aside> : null}
      </main>
      )}
    </div>
  );
}

function EvidenceSummaryStrip({
  challengeTags,
  performanceItems,
  strengthTags,
  suggestedLevel,
}: {
  challengeTags: string[];
  performanceItems: string[];
  strengthTags: string[];
  suggestedLevel: AssessmentLevel | "";
}) {
  return (
    <div className="liveEvidenceStrip" aria-label="Synthèse automatique des observations">
      <div>
        <span>Forces</span>
        <strong>{strengthTags.length ? strengthTags.join("; ") : "À documenter"}</strong>
      </div>
      <div>
        <span>À surveiller</span>
        <strong>{challengeTags.length ? challengeTags.join("; ") : "À documenter"}</strong>
      </div>
      <div>
        <span>Repères d'observation</span>
        <strong>{performanceItems.length ? performanceItems.join("; ") : "À confirmer"}</strong>
      </div>
      <div>
        <span>Niveau suggéré</span>
        <strong>{suggestedLevel || "Preuves insuffisantes"}</strong>
      </div>
    </div>
  );
}

function EvaluatorGuidePage({ framework, onClose }: { framework: FrameworkConfig; onClose: () => void }) {
  return (
    <section className="guidePage panel" aria-label="Guide d'utilisation pour l'évaluateur">
      <div className="guideHero">
        <div>
          <p className="eyebrow">Aide évaluateur</p>
          <h2>Guide rapide d'utilisation</h2>
          <p>
            Commencez par choisir le cadre d'évaluation dans l'en-tête. La console ajuste ensuite les niveaux, les
            étapes, les critères, les tags et le résumé selon le cadre sélectionné.
          </p>
        </div>
        <button className="primaryButton" onClick={onClose} type="button">
          Retour à l'app
        </button>
      </div>

      <div className="guideFlow" aria-label="Déroulement recommandé">
        {framework.guideSteps.map((step, index) => (
          <article className="guideStep" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </article>
        ))}
      </div>

      <div className="guideGrid">
        <section className="guideBlock guideBlockWide frameworkGuideBlock">
          <h3>Choix du cadre</h3>
          <ul>
            <li><strong>CCC – CECR/CEFR</strong> : utilisez ce cadre pour les évaluations CCC et les rapports avec niveaux CECR/CEFR.</li>
            <li><strong>PFL2 / SLE – A-C</strong> : utilisez ce cadre pour une estimation interne PFL2/SLE avec niveaux A-, A, A+, B-, B, B+, C-, C et C+. La zone A+ correspond à OF13-OF40 / pré-B; OF40 n'est pas traité comme B.</li>
            <li>Le choix du cadre change les étapes, les questions, les critères, les niveaux, les tags rapides et le libellé du résumé généré.</li>
            <li>Le cadre doit être choisi avant de commencer l'entretien afin d'éviter de mélanger les preuves et les niveaux.</li>
          </ul>
        </section>

        <section className="guideBlock">
          <h3>Pendant l'entretien</h3>
          <ul>
            <li>Gardez les questions au centre de l'écran.</li>
            <li>Utilisez Étape suivante pour avancer sans quitter la zone centrale.</li>
            <li>Cliquez les tags rapides seulement lorsqu'une preuve précise est observée.</li>
            <li>Utilisez les repères d'observation pour garder une lecture globale de la performance.</li>
            <li>La sauvegarde automatique conserve le brouillon local pendant l'entretien.</li>
          </ul>
        </section>

        <section className="guideBlock guideBlockWide">
          <h3>Tags rapides et repères d'observation</h3>
          <ul>
            <li><strong>Tags rapides</strong> : ils servent à consigner des preuves précises pendant que la personne candidate parle.</li>
            <li>Les onglets <strong>Fréquents</strong>, <strong>Global</strong>, <strong>À améliorer</strong>, <strong>Forces</strong> et <strong>Exemples</strong> permettent de retrouver rapidement le bon type de preuve.</li>
            <li>Un tag choisi alimente les notes structurées correspondantes : observations générales, forces, défis, erreurs précises ou exemples de performance forte.</li>
            <li>Cliquez une fois pour ajouter le tag, une deuxième fois pour marquer une preuve forte, une troisième fois pour le retirer.</li>
            <li><strong>Repères d'observation</strong> : ils ne remplacent pas les tags; ils donnent une lecture globale de la compréhension, de l'autonomie, de la complexité et de la précision.</li>
            <li>Utilisez les repères quand vous observez une tendance générale sur plusieurs réponses, pas pour noter un seul mot ou une seule erreur.</li>
            <li>Les deux éléments se complètent : les tags documentent les preuves; les repères aident à orienter la suggestion de niveau.</li>
          </ul>
        </section>

        <section className="guideBlock">
          <h3>Repères d'observation</h3>
          <ul>
            <li>Utilisez-les pour garder une vue globale de la performance.</li>
            <li>Solide partout ne donne pas automatiquement le niveau le plus élevé.</li>
            <li>Ils servent à déclencher une vérification, pas à remplacer l'évaluateur.</li>
          </ul>
        </section>

        <section className="guideBlock">
          <h3>{framework.id === "pfl2-sle" ? "Extension niveau C" : "Approfondissement C"}</h3>
          <ul>
            <li>{framework.id === "pfl2-sle" ? "Activez cette étape seulement si des preuves solides au-dessus de B apparaissent." : "La boîte apparaît si des preuves B2+ ou avancées s'accumulent."}</li>
            <li>Posez 1 ou 2 questions pour confirmer ou écarter le niveau avancé.</li>
            <li>Ajoutez les tags C seulement si la réponse apporte une vraie preuve.</li>
          </ul>
        </section>

        <section className="guideBlock">
          <h3>Après l'entretien</h3>
          <ul>
            <li>Utilisez Finaliser après avoir quitté la personne candidate.</li>
            <li>Confirmez ou modifiez chaque niveau.</li>
            <li>Validez le niveau final avant d'utiliser la banque d'évaluation finale.</li>
            <li>Relisez toujours le résumé avant de le copier dans le rapport.</li>
          </ul>
        </section>

        {framework.id === "pfl2-sle" ? (
          <section className="guideBlock guideBlockWide">
            <h3>Estimation indicative de parcours PFL2</h3>
            <ul>
              <li><strong>Automatique par niveau final</strong> : utilisez ce mode si vous voulez une fourchette rapide et prudente.</li>
              <li><strong>Préciser le point OF</strong> : utilisez ce mode si l'entretien permet de situer le point de départ avec plus de confiance.</li>
              <li><strong>Ne pas inclure d'estimation</strong> : utilisez ce mode si le rapport ne doit pas contenir de projection de durée.</li>
              <li>L'estimation reste indicative et ne constitue pas une garantie d'atteinte du niveau B ou C.</li>
            </ul>
          </section>
        ) : null}

        <section className="guideBlock guideBlockWide">
          <h3>Banque d'évaluation finale</h3>
          <ul>
            <li>La banque propose des formulations standard pour uniformiser les rapports.</li>
            <li>Une formulation choisie est copiée dans le champ Évaluation finale.</li>
            <li>Le texte reste entièrement modifiable : ajoutez les preuves, nuancez et retirez ce qui ne s'applique pas.</li>
            <li>Le résumé doit être généré seulement après avoir relu et adapté cette évaluation finale.</li>
          </ul>
        </section>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
  wide = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  readOnly?: boolean;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

function PromptBlock({
  title,
  items,
  emphasis = false,
  compact = false,
  wide = false,
}: {
  title: string;
  items: string[];
  emphasis?: boolean;
  compact?: boolean;
  wide?: boolean;
}) {
  const className = [
    emphasis ? "promptBlock emphasis" : "promptBlock",
    compact ? "compact" : "",
    wide ? "wide" : "",
  ].join(" ");

  return (
    <section className={className}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function CProbePanel({ probes }: { probes: CProbe[] }) {
  return (
    <section className="cProbePanel" aria-label="Approfondissement C recommandé">
      <div className="cProbeHeader">
        <Sparkles size={16} aria-hidden="true" />
        <div>
          <p className="eyebrow">Indice B2+ ou plus</p>
          <h3>Approfondissement C recommandé</h3>
          <p>
            Posez 1 ou 2 questions pour confirmer ou écarter C1/C2. Cette alerte ne fixe pas le niveau final.
          </p>
        </div>
      </div>
      <div className="cProbeGrid">
        {probes.map((probe) => (
          <article className="cProbeCard" key={probe.title}>
            <strong>{probe.title}</strong>
            <p>{probe.prompt}</p>
            <small>{probe.focus}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function RailInfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="railInfoBlock">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function getCriterionSuggestions(
  activeTags: ActiveTagEvidence[],
  performance: Record<PerformanceKey, PerformanceValue>,
  config: FrameworkConfig,
): Record<CriterionKey, CriterionSuggestion> {
  const evidence = config.criteria.reduce(
    (accumulator, { key }) => ({
      ...accumulator,
      [key]: [] as { score: number; weight: number; reason: string }[],
    }),
    {} as Record<CriterionKey, { score: number; weight: number; reason: string }[]>,
  );

  activeTags.forEach(({ tag, state }) => {
    const rule = config.tagSuggestionRules.find((candidate) => candidate.tag === tag);

    if (!rule) {
      return;
    }

    const weight = state === "strong" ? 1.45 : 1;

    rule.criteria.forEach((criterion) => {
      evidence[criterion].push({
        score: rule.score,
        weight,
        reason: state === "strong" ? `${rule.reason} fortement observé` : rule.reason,
      });
    });
  });

  performanceSignals.forEach(({ key }) => {
    const signal = performance[key];
    const rule = config.performanceSuggestionRules[key][signal];

    if (!rule) {
      return;
    }

    rule.criteria.forEach((criterion) => {
      evidence[criterion].push({
        score: rule.score,
        weight: 1.15,
        reason: rule.reason,
      });
    });
  });

  return config.criteria.reduce(
    (suggestions, { key }) => {
      const items = evidence[key];

      if (!items.length) {
        return {
          ...suggestions,
          [key]: { level: "", confidence: "low", reasons: [] },
        };
      }

      const weightedTotal = items.reduce((total, item) => total + item.score * item.weight, 0);
      const totalWeight = items.reduce((total, item) => total + item.weight, 0);
      const score = weightedTotal / totalWeight;
      const confidence = items.length >= 4 ? "high" : items.length >= 2 ? "medium" : "low";
      const reasons = [...new Set(items.map((item) => item.reason))].slice(0, 4);

      return {
        ...suggestions,
        [key]: {
          level: getLevelFromEvidenceScore(score, config),
          confidence,
          reasons,
        },
      };
    },
    {} as Record<CriterionKey, CriterionSuggestion>,
  );
}

function getLevelFromEvidenceScore(score: number, config: FrameworkConfig): AssessmentLevel {
  if (config.id === "cefr-ccc") {
    if (score < 1.7) return "A1";
    if (score < 2.5) return "A2";
    if (score < 3.25) return "B1";
    if (score < 3.75) return "B1+";
    if (score < 4.35) return "B2";
    if (score < 4.75) return "B2+";
    if (score < 5.25) return "C1";
    if (score < 5.7) return "C1+";
    return "C2";
  }

  if (score < 1.9) return "A-";
  if (score < 2.35) return "A";
  if (score < 3.1) return "A+";
  if (score < 3.35) return "B-";
  if (score < 3.85) return "B";
  if (score < 4.45) return "B+";
  if (score < 5.05) return "C-";
  if (score < 5.55) return "C";
  return "C+";
}

function getSuggestedLevelFromSuggestions(
  suggestions: Record<CriterionKey, CriterionSuggestion>,
  config: FrameworkConfig,
): AssessmentLevel | "" {
  const selected = config.criteria
    .map(({ key }) => suggestions[key].level)
    .filter((level): level is AssessmentLevel => Boolean(level));

  if (!selected.length) {
    return "";
  }

  const average = selected.reduce((total, level) => total + config.levelValues[level], 0) / selected.length;

  return getLevelFromEvidenceScore(average, config);
}

function getSuggestedLevel(ratings: CriterionRating, config: FrameworkConfig): AssessmentLevel | "" {
  const selected = config.criteria
    .map(({ key }) => ratings[key])
    .filter((level): level is AssessmentLevel => Boolean(level) && isFrameworkLevel(level, config));

  if (!selected.length) {
    return "";
  }

  const average = selected.reduce((total, level) => total + config.levelValues[level], 0) / selected.length;

  if (config.id === "cefr-ccc") {
    if (average < 2) return "A1";
    if (average < 3) return "A2";
    if (average < 3.5) return "B1";
    if (average < 4) return "B1+";
    if (average < 4.5) return "B2";
    if (average < 5) return "B2+";
    if (average < 5.5) return "C1";
    if (average < 5.9) return "C1+";
    return "C2";
  }

  return getLevelFromEvidenceScore(average, config);
}

function shouldShowCProbe(
  suggestedLevel: AssessmentLevel | "",
  ratings: CriterionRating,
  stats: TagStats,
  performance: Record<PerformanceKey, PerformanceValue>,
  config: FrameworkConfig,
) {
  const suggestedValue = suggestedLevel ? config.levelValues[suggestedLevel] : 0;
  const hasCLevelRating = config.criteria.some(({ key }) => {
    const level = ratings[key];
    return Boolean(level && config.levelValues[level] >= config.levelValues.C1);
  });
  const hasAdvancedCriterion = config.criteria.some(({ key }) => {
    const level = ratings[key];
    return Boolean(level && config.levelValues[level] >= config.levelValues["B2+"]);
  });
  const solidSignals = performanceSignals.filter(({ key }) => performance[key] === 3).length;
  const broadSolidProfile = stats.strength >= 4 && solidSignals >= 3 && stats.challenge <= 1;
  const strongAdvancedEvidence = stats.strength >= 6 && stats.strongIntensity >= 2 && solidSignals >= 2;
  const manyStrengthsWithoutChallenges = stats.strength >= 8 && stats.challenge === 0;

  return (
    suggestedValue >= config.levelValues["B2+"] ||
    hasCLevelRating ||
    hasAdvancedCriterion ||
    broadSolidProfile ||
    strongAdvancedEvidence ||
    manyStrengthsWithoutChallenges
  );
}

function isFrameworkLevel(level: string, config: FrameworkConfig): level is AssessmentLevel {
  return config.levels.includes(level as AssessmentLevel);
}

function getJudgmentPhraseOptions(
  level: string,
  activeTags: ActiveTagEvidence[],
  performance: Record<PerformanceKey, PerformanceValue>,
  stats: TagStats,
  config: FrameworkConfig,
): JudgmentPhrase[] {
  const band = getJudgmentLevelBand(level, config);
  const basePhrases =
    config.id === "cefr-ccc" && isFrameworkLevel(level, config)
      ? cefrJudgmentPhraseTemplates[level as CEFRLevel]
      : config.id === "pfl2-sle" && isFrameworkLevel(level, config)
      ? pfl2JudgmentPhraseTemplates[level as SLELevel]
      : judgmentPhraseTemplates[band];
  const observedTags = activeTags.map(({ tag }) => tag);
  const challengeTags = activeTags
    .filter(({ group }) => group.tone === "challenge")
    .map(({ tag }) => tag)
    .slice(0, 3);
  const strengthTags = activeTags
    .filter(({ group }) => group.tone === "strength")
    .map(({ tag }) => tag)
    .slice(0, 3);
  const fragileSignals = performanceSignals
    .filter(({ key }) => performance[key] === 1)
    .map(({ label }) => label.toLowerCase());
  const solidSignals = performanceSignals
    .filter(({ key }) => performance[key] === 3)
    .map(({ label }) => label.toLowerCase());

  const phrases: JudgmentPhrase[] = [
    ...basePhrases,
    {
      id: "evidence-base",
      category: "Preuves",
      title: "Appui sur les preuves",
      text: observedTags.length
        ? `Cette évaluation repose sur les preuves observées pendant l'entretien, notamment : ${observedTags
            .slice(0, 5)
            .join(", ")}.`
        : "Cette évaluation doit être confirmée à partir des preuves observées pendant l'entretien oral, en tenant compte des cotes par critère et des exemples recueillis.",
    },
  ];

  if (challengeTags.length) {
    phrases.push({
      id: "challenge-nuance",
      category: "Nuance",
      title: "Limites observées",
      text: `Les limites les plus importantes observées concernent surtout : ${challengeTags.join(
        ", ",
      )}. Ces limites doivent être prises en compte dans l'interprétation du niveau final.`,
    });
  }

  if (strengthTags.length) {
    phrases.push({
      id: "strength-nuance",
      category: "Preuves",
      title: "Forces observées",
      text: `Le niveau retenu est également appuyé par certaines forces observées, notamment : ${strengthTags.join(
        ", ",
      )}.`,
    });
  }

  if (fragileSignals.length) {
    phrases.push({
      id: "fragile-signals",
      category: "Prudence",
      title: "Performance variable",
      text: `La performance doit être interprétée avec prudence, car les repères d'observation indiquent une fragilité en ${fragileSignals.join(
        ", ",
      )}.`,
    });
  }

  if (solidSignals.length && stats.challenge <= stats.strength) {
    phrases.push({
      id: "solid-signals",
      category: "Preuves",
      title: "Autonomie observée",
      text: `La performance montre des indices solides en ${solidSignals.join(
        ", ",
      )}, ce qui soutient une lecture plus autonome de la compétence orale observée.`,
    });
  }

  if (stats.challenge >= 3 && isFrameworkLevel(level, config) && config.levelValues[level] >= 4) {
    phrases.push({
      id: "high-level-caution",
      category: "Prudence",
      title: "Niveau élevé à justifier",
      text: "Comme plusieurs difficultés ont été relevées, le niveau final élevé doit être justifié par des exemples clairs de performance autonome et stable.",
    });
  }

  return phrases.filter((phrase, index, list) => list.findIndex((item) => item.text === phrase.text) === index).slice(0, 8);
}

function getJudgmentLevelBand(level: string, config: FrameworkConfig): "emerging" | "functional" | "autonomous" | "advanced" {
  if (!isFrameworkLevel(level, config)) {
    return "functional";
  }

  if (level === "A1" || level === "A2" || level === "A-" || level === "A" || level === "A+") {
    return "emerging";
  }

  if (level === "B1" || level === "B1+" || level === "B-" || level === "B") {
    return "functional";
  }

  if (level === "B2" || level === "B2+" || level === "B+" || level === "C-") {
    return "autonomous";
  }

  return "advanced";
}

function getRecommendations(level: string, config: FrameworkConfig): string[] {
  if (!isFrameworkLevel(level, config)) {
    return [
      "Confirmer le niveau final avant de formuler des recommandations détaillées.",
      "Ajouter les observations et exemples précis recueillis pendant l'évaluation orale.",
    ];
  }

  if (config.id === "pfl2-sle") {
    if (level === "C-" || level === "C" || level === "C+") return config.recommendationTemplates["C-/C/C+"];
    if (level === "B" || level === "B+") return config.recommendationTemplates["B/B+"];
    if (level === "B-") return config.recommendationTemplates["B-"];
    return config.recommendationTemplates["A-/A/A+"];
  }

  if (level === "C2") return config.recommendationTemplates.C2;
  if (level === "C1" || level === "C1+") return config.recommendationTemplates["C1/C1+"];
  if (level === "B2" || level === "B2+") return config.recommendationTemplates["B2/B2+"];
  if (level === "A1" || level === "A2") return config.recommendationTemplates["A1/A2"];
  return config.recommendationTemplates["B1/B1+"];
}

function getCoherenceAlert(level: string, suggestedLevel: AssessmentLevel | "", stats: TagStats, config: FrameworkConfig) {
  if (!isFrameworkLevel(level, config)) {
    return "";
  }

  const levelValue = config.levelValues[level];
  const suggestedValue = suggestedLevel ? config.levelValues[suggestedLevel] : 0;
  const challengePressure = stats.challenge + stats.strongIntensity;
  const strengthPressure = stats.strength;

  if (levelValue >= 4.5 && challengePressure >= 5) {
    return "Plusieurs tags de difficulté sont sélectionnés alors que le niveau final est élevé. Vérifier que les preuves soutiennent bien ce niveau.";
  }

  if (levelValue <= 2 && strengthPressure >= 4) {
    return "Plusieurs forces sont sélectionnées avec un niveau final très bas. Vérifier si ces forces sont ponctuelles ou suffisantes pour ajuster le niveau.";
  }

  if (suggestedValue && Math.abs(levelValue - suggestedValue) >= 1) {
    return "Le niveau final s'écarte du niveau suggéré par les critères. Ajouter une justification brève dans l'évaluation finale.";
  }

  return "";
}

function normalizeStoredLevel(value: string, config: FrameworkConfig): AssessmentLevel | "" {
  if (config.id === "pfl2-sle") {
    const legacySleLevels: Record<string, SLELevel> = {
      ["Inf\u00e9rieur \u00e0 B"]: "A-",
      ["Niveau A"]: "A",
      ["Pr\u00e9-B"]: "A+",
    };

    if (legacySleLevels[value]) {
      return legacySleLevels[value];
    }
  }

  return isFrameworkLevel(value, config) ? value : "";
}

function normalizeSession(draft: Partial<OralAssessmentSession>): OralAssessmentSession {
  const frameworkId: FrameworkId =
    draft.frameworkId && frameworkConfigs[draft.frameworkId] ? draft.frameworkId : "cefr-ccc";
  const config = frameworkConfigs[frameworkId];
  const cExtensionEnabled = Boolean(draft.cExtensionEnabled);
  const allowedStages = getFrameworkStages(config, cExtensionEnabled);
  const fallback = createSession(frameworkId);
  const ratings = { ...createEmptyRatings(), ...(draft.ratings ?? {}) };

  (Object.keys(ratings) as (keyof CriterionRating)[]).forEach((key) => {
    const value = ratings[key];

    if (value) {
      ratings[key] = normalizeStoredLevel(value, config);
    }
  });

  return {
    ...fallback,
    ...draft,
    frameworkId,
    candidate: {
      ...fallback.candidate,
      ...(draft.candidate ?? {}),
      client: draft.candidate?.client ?? config.defaultClient,
    },
    ratings,
    notes: {
      ...fallback.notes,
      ...(draft.notes ?? {}),
    },
    selectedStage: allowedStages.some((stage) => stage.id === draft.selectedStage)
      ? draft.selectedStage ?? allowedStages[0].id
      : allowedStages[0].id,
    cExtensionEnabled,
    trainingEstimate: normalizeTrainingEstimate(draft.trainingEstimate),
    summary: draft.summary ?? "",
    createdAt: draft.createdAt ?? fallback.createdAt,
    updatedAt: draft.updatedAt ?? fallback.updatedAt,
  };
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
