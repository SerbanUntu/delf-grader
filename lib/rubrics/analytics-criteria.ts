/**
 * A kind of mistake that a deduction made by the grader belongs to, such as "Accords".
 */
export interface MistakeCategory {
  id: string;
  frenchName: string;
  englishSubtitle: string;
}

/**
 * A criterion shared by every rubric, used to compare exams graded with different rubrics and to hold the mistake categories.
 */
export interface AnalyticsCriterion {
  id: string;
  frenchName: string;
  englishSubtitle: string;
  categories: readonly MistakeCategory[];
}

export const analyticsCriteria = [
  {
    id: "task",
    frenchName: "Réalisation de la tâche",
    englishSubtitle: "Task completion",
    categories: [
      {
        id: "instructions",
        frenchName: "Respect de la consigne",
        englishSubtitle: "Following the instructions",
      },
      {
        id: "textType",
        frenchName: "Type de texte",
        englishSubtitle: "Text type conventions",
      },
      {
        id: "ideas",
        frenchName: "Développement des idées",
        englishSubtitle: "Developing ideas and arguments",
      },
    ],
  },
  {
    id: "coherence",
    frenchName: "Cohérence et cohésion",
    englishSubtitle: "Structure and linking of ideas",
    categories: [
      {
        id: "structure",
        frenchName: "Organisation du texte",
        englishSubtitle: "Structure and paragraphs",
      },
      {
        id: "connectors",
        frenchName: "Connecteurs",
        englishSubtitle: "Linking words",
      },
      {
        id: "references",
        frenchName: "Reprises et références",
        englishSubtitle: "Referring back to ideas",
      },
      {
        id: "punctuation",
        frenchName: "Ponctuation",
        englishSubtitle: "Punctuation",
      },
    ],
  },
  {
    id: "sociolinguistic",
    frenchName: "Adéquation sociolinguistique",
    englishSubtitle: "Register and social conventions",
    categories: [
      {
        id: "register",
        frenchName: "Registre",
        englishSubtitle: "Register and tone",
      },
      {
        id: "tuOrVous",
        frenchName: "Tutoiement et vouvoiement",
        englishSubtitle: "Choosing tu or vous",
      },
      {
        id: "formulas",
        frenchName: "Formules d'usage",
        englishSubtitle: "Greetings and closings",
      },
    ],
  },
  {
    id: "vocabulary",
    frenchName: "Lexique",
    englishSubtitle: "Vocabulary and spelling",
    categories: [
      {
        id: "vocabularyRange",
        frenchName: "Étendue du lexique",
        englishSubtitle: "Range and repetition",
      },
      {
        id: "wordChoice",
        frenchName: "Choix des mots",
        englishSubtitle: "Word choice",
      },
      {
        id: "spelling",
        frenchName: "Orthographe lexicale",
        englishSubtitle: "Spelling",
      },
    ],
  },
  {
    id: "grammar",
    frenchName: "Morphosyntaxe",
    englishSubtitle: "Grammar",
    categories: [
      {
        id: "verbForms",
        frenchName: "Conjugaison",
        englishSubtitle: "Verb forms",
      },
      {
        id: "tensesAndMoods",
        frenchName: "Temps et modes",
        englishSubtitle: "Tenses and moods",
      },
      {
        id: "agreement",
        frenchName: "Accords",
        englishSubtitle: "Agreement",
      },
      {
        id: "articlesAndPrepositions",
        frenchName: "Déterminants et prépositions",
        englishSubtitle: "Articles and prepositions",
      },
      {
        id: "sentenceStructure",
        frenchName: "Construction des phrases",
        englishSubtitle: "Sentence structure",
      },
    ],
  },
] as const satisfies readonly AnalyticsCriterion[];

export type AnalyticsCriterionId = (typeof analyticsCriteria)[number]["id"];

export type MistakeCategoryId =
  (typeof analyticsCriteria)[number]["categories"][number]["id"];
