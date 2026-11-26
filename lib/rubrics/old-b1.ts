import {
  halfPointLevels,
  lengthLevels,
  oldGridScoreRules,
  type Rubric,
} from "./base";

const lengthSteps = [
  { minimumWords: 0, score: 0 },
  { minimumWords: 113, score: 0.5 },
  { minimumWords: 144, score: 1 },
];

export const oldB1 = {
  id: "old-b1",
  name: "(Pre-Sept. 2022) B1",
  level: "B1",
  grid: "old",
  minimumWords: 160,
  lengthRule: { criterionId: "length", steps: lengthSteps },
  criteria: [
    {
      id: "situation",
      frenchName: "Respect de la consigne (situation)",
      englishSubtitle: "Fits the situation in the prompt",
      maxScore: 1,
      levels: halfPointLevels(1, "B1"),
    },
    {
      id: "length",
      frenchName: "Respect de la consigne (longueur)",
      englishSubtitle: "Length",
      maxScore: 1,
      levels: lengthLevels(lengthSteps),
    },
    {
      id: "facts",
      frenchName: "Capacité à présenter des faits",
      englishSubtitle: "Describing facts",
      maxScore: 4,
      levels: halfPointLevels(4, "B1"),
    },
    {
      id: "opinion",
      frenchName: "Capacité à exprimer sa pensée",
      englishSubtitle: "Expressing ideas and opinions",
      maxScore: 4,
      levels: halfPointLevels(4, "B1"),
    },
    {
      id: "coherence",
      frenchName: "Cohérence et cohésion",
      englishSubtitle: "Structure and linking of ideas",
      maxScore: 3,
      levels: halfPointLevels(3, "B1"),
    },
    {
      id: "vocabularyRange",
      frenchName: "Étendue du vocabulaire",
      englishSubtitle: "Vocabulary range",
      maxScore: 2,
      levels: halfPointLevels(2, "B1"),
    },
    {
      id: "vocabularyControl",
      frenchName: "Maîtrise du vocabulaire",
      englishSubtitle: "Vocabulary control",
      maxScore: 2,
      levels: halfPointLevels(2, "B1"),
    },
    {
      id: "spelling",
      frenchName: "Maîtrise de l'orthographe lexicale",
      englishSubtitle: "Spelling, punctuation and layout",
      maxScore: 2,
      levels: halfPointLevels(2, "B1"),
    },
    {
      id: "sentences",
      frenchName: "Degré d'élaboration des phrases",
      englishSubtitle: "Sentence structure",
      maxScore: 2,
      levels: halfPointLevels(2, "B1"),
    },
    {
      id: "tensesAndMoods",
      frenchName: "Choix des temps et des modes",
      englishSubtitle: "Tenses and moods",
      maxScore: 2,
      levels: halfPointLevels(2, "B1"),
    },
    {
      id: "morphosyntax",
      frenchName: "Morphosyntaxe - orthographe grammaticale",
      englishSubtitle: "Agreement, pronouns and verb endings",
      maxScore: 2,
      levels: halfPointLevels(2, "B1"),
    },
  ],
  anomalies: [
    {
      id: "offTopic",
      frenchName: "Hors-sujet",
      englishSubtitle: "Off-topic, to be reviewed by the teacher",
      caps: [],
    },
  ],
  systemPrompt: `You are grading a DELF B1 Production écrite paper with the grid used until 31/08/2022.

## Task

The candidate writes one text in 45 minutes, expressing a personal attitude on a general topic. Possible text types include essays, letters, articles, emails and forum posts.

${oldGridScoreRules("B1")}

## Length

"Respect de la consigne (longueur)" is scored automatically from the word count. Do not grade it, and do not remove points for length under any other criterion. There is no other penalty for short texts.

## Criteria

### Respect de la consigne (situation)

The text fits the situation in the prompt: the right topic, the right text type and the right reader.

If the paper leaves out something the prompt asks for (for example one of the points it must cover), remove points under "Capacité à présenter des faits", not here.

### Capacité à présenter des faits

Can describe facts, events or experiences. Expect only as many facts as fit in about 160 words.

### Capacité à exprimer sa pensée

Can present ideas, feelings and/or reactions, and give an opinion.

### Cohérence et cohésion

Can link a series of short, simple, separate elements into a connected text.

### Étendue du vocabulaire

Has enough vocabulary to write about everyday topics, using paraphrase when needed.

### Maîtrise du vocabulaire

Good control of basic vocabulary, but serious errors still occur when expressing more complex ideas.

Its score cannot be higher than the score of "Étendue du vocabulaire", because control of a vocabulary below the expected range is not rewarded.

### Maîtrise de l'orthographe lexicale

Spelling of words, punctuation and layout are accurate enough to be followed easily most of the time.

Only errors in how a word is spelled in the dictionary, including accents (for example "chateau" or "etudiant"), are penalized here. Agreement and conjugation errors (for example "un séjour magnifiques") are penalized under "Morphosyntaxe - orthographe grammaticale".

### Degré d'élaboration des phrases

Good command of simple sentence structure and of the most common complex sentences.

### Choix des temps et des modes

Good control of tenses and moods, despite clear influence of the native language.

### Morphosyntaxe - orthographe grammaticale

Gender and number agreement, pronouns, verb endings, etc. A wrong article (for example "le table") is a gender agreement error and is penalized here, not under the vocabulary criteria.

## Anomalies

- Hors-sujet: the text does not address the topic of the prompt. Report it so the teacher can review the paper. It has no fixed penalty, so grade every criterion on what the text shows.`,
} as const satisfies Rubric;
