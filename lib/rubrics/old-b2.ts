import { halfPointLevels, lengthLevels, type Rubric } from "./base";

const lengthSteps = [
  { minimumWords: 0, score: 0 },
  { minimumWords: 176, score: 0.5 },
  { minimumWords: 225, score: 1 },
];

export const oldB2 = {
  id: "old-b2",
  name: "(Pre-Sept. 2022) B2",
  level: "B2",
  grid: "old",
  minimumWords: 250,
  lengthRule: { criterionId: "length", steps: lengthSteps },
  criteria: [
    {
      id: "situation",
      frenchName: "Respect de la consigne (situation)",
      englishSubtitle: "Fits the situation and text type in the prompt",
      maxScore: 1,
      levels: halfPointLevels(1, "B2"),
    },
    {
      id: "length",
      frenchName: "Respect de la consigne (longueur)",
      englishSubtitle: "Length",
      maxScore: 1,
      levels: lengthLevels(lengthSteps),
    },
    {
      id: "sociolinguistic",
      frenchName: "Correction sociolinguistique",
      englishSubtitle: "Register and formality",
      maxScore: 2,
      levels: halfPointLevels(2, "B2"),
    },
    {
      id: "facts",
      frenchName: "Capacité à présenter des faits",
      englishSubtitle: "Describing facts",
      maxScore: 3,
      levels: halfPointLevels(3, "B2"),
    },
    {
      id: "argument",
      frenchName: "Capacité à argumenter une prise de position",
      englishSubtitle: "Arguing a position",
      maxScore: 3,
      levels: halfPointLevels(3, "B2"),
    },
    {
      id: "coherence",
      frenchName: "Cohérence et cohésion",
      englishSubtitle: "Structure and linking of ideas",
      maxScore: 4,
      levels: halfPointLevels(4, "B2"),
    },
    {
      id: "vocabularyRange",
      frenchName: "Étendue du vocabulaire",
      englishSubtitle: "Vocabulary range",
      maxScore: 2,
      levels: halfPointLevels(2, "B2"),
    },
    {
      id: "vocabularyControl",
      frenchName: "Maîtrise du vocabulaire",
      englishSubtitle: "Vocabulary control",
      maxScore: 2,
      levels: halfPointLevels(2, "B2"),
    },
    {
      id: "spelling",
      frenchName: "Maîtrise de l'orthographe",
      englishSubtitle: "Spelling",
      maxScore: 1,
      levels: halfPointLevels(1, "B2"),
    },
    {
      id: "grammar",
      frenchName: "Choix des formes",
      englishSubtitle: "Grammar, tenses and moods",
      maxScore: 4,
      levels: halfPointLevels(4, "B2"),
    },
    {
      id: "sentences",
      frenchName: "Degré d'élaboration des phrases",
      englishSubtitle: "Sentence structure",
      maxScore: 2,
      levels: halfPointLevels(2, "B2"),
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
  systemPrompt: `You are grading a DELF B2 Production écrite paper with the grid used until 31/08/2022.

## Task

The candidate writes one text in 60 minutes, taking and arguing a personal position. Possible text types include contributions to a debate, formal letters and critical articles.

## Length

"Respect de la consigne (longueur)" is scored automatically from the word count. Do not grade it, and do not remove points for length under any other criterion. There is no other penalty for short texts.

## Criteria

Each descriptor states what is expected at B2. Give the maximum score when the paper fully meets it, and remove points in proportion to how far the paper falls short of it.

### Respect de la consigne (situation)

Respects the situation and the type of text requested.

### Correction sociolinguistique

Can adapt the text to the situation and the reader, and use the level of formality the circumstances call for. Check:
- the opening and closing formulas (for formal letters)
- the register (vocabulary, syntax, style)

### Capacité à présenter des faits

Can describe facts, events or situations clearly and precisely. For example, when writing to a school director to request changes, the writer must describe the current situation that motivates the request.

### Capacité à argumenter une prise de position

Can develop an argument that highlights the important points and relevant details appropriately.

### Cohérence et cohésion

- Can clearly link ideas into a fluent, coherent text.
- Follows layout conventions.
- Punctuation is fairly accurate but may show native-language influence.

### Étendue du vocabulaire

Uses a fairly wide range of vocabulary, despite occasional gaps that lead to paraphrasing.

### Maîtrise du vocabulaire

Vocabulary is generally appropriate. Confusions and wrong word choices occur but do not block communication.

### Maîtrise de l'orthographe

- Produces a continuous, clear and understandable text.
- Spelling is fairly accurate but may show native-language influence.
- Can spell most words expected at this level correctly.

Only spelling errors in word forms (for example "vancance") are penalized here. Grammatical spelling errors (for example "trois sac") are penalized under "Choix des formes".

### Choix des formes

Good grammatical control. Non-systematic errors may still occur but do not cause misunderstandings. Check:
- the tenses and moods the task calls for (for example future, conditional or subjunctive when making proposals)
- the sequence of tenses (concordance des temps)
- morphosyntax (verb endings, gender and number agreement, pronominal constructions, etc.)

### Degré d'élaboration des phrases

Uses a variety of sentence constructions appropriately.

## Anomalies

- Hors-sujet: the text does not address the topic of the prompt. Report it so the teacher can review the paper. It has no fixed penalty, so grade every criterion on what the text shows.`,
} as const satisfies Rubric;
