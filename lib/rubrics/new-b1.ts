import { bandLevels, type Rubric } from "./base";

export const newB1 = {
  id: "new-b1",
  name: "New B1",
  level: "B1",
  grid: "new",
  minimumWords: 160,
  tooShortMaxWords: 79,
  criteria: [
    {
      id: "task",
      frenchName: "Réalisation de la tâche",
      englishSubtitle: "Task completion",
      maxScore: 5,
      levels: bandLevels("B1"),
    },
    {
      id: "coherence",
      frenchName: "Cohérence et cohésion",
      englishSubtitle: "Structure and linking of ideas",
      maxScore: 5,
      levels: bandLevels("B1"),
    },
    {
      id: "sociolinguistic",
      frenchName: "Adéquation sociolinguistique",
      englishSubtitle: "Register and social conventions",
      maxScore: 5,
      levels: bandLevels("B1"),
    },
    {
      id: "vocabulary",
      frenchName: "Lexique",
      englishSubtitle: "Vocabulary and spelling",
      maxScore: 5,
      levels: bandLevels("B1"),
    },
    {
      id: "grammar",
      frenchName: "Morphosyntaxe",
      englishSubtitle: "Grammar",
      maxScore: 5,
      levels: bandLevels("B1"),
    },
  ],
  anomalies: [
    {
      id: "wrongTopic",
      frenchName: "Hors-sujet thématique",
      englishSubtitle: "Wrong topic",
      caps: [
        { criterionId: "task", maxScore: 3 },
        { criterionId: "vocabulary", maxScore: 3 },
      ],
    },
    {
      id: "wrongTextType",
      frenchName: "Hors-sujet discursif",
      englishSubtitle: "Wrong text type",
      caps: [
        { criterionId: "task", maxScore: 1 },
        { criterionId: "coherence", maxScore: 1 },
      ],
    },
    {
      id: "wrongTopicAndTextType",
      frenchName: "Hors-sujet complet",
      englishSubtitle: "Wrong topic and text type",
      caps: [
        { criterionId: "task", maxScore: 0 },
        { criterionId: "coherence", maxScore: 0 },
        { criterionId: "sociolinguistic", maxScore: 0 },
        { criterionId: "vocabulary", maxScore: 1 },
        { criterionId: "grammar", maxScore: 1 },
      ],
    },
  ],
  systemPrompt: `You are grading a DELF B1 Production écrite paper with the grid used since 01/09/2022.

## Task

The candidate writes one text in 45 minutes, expressing a personal attitude on a general topic. Possible text types include essays, letters, articles, emails and forum posts.

## Bands

For each criterion, choose exactly one band: "Non répondu ou production insuffisante", "En dessous du niveau ciblé", "Au niveau ciblé B1" or "Au niveau ciblé B1+". Use "Non répondu ou production insuffisante" only when the paper gives nothing to assess for that criterion. The descriptors of the other bands are below.

## Length

Papers far below the minimum length are handled automatically. For any other paper below the minimum length, there is no fixed deduction: judge the shortfall as part of "Réalisation de la tâche".

## Criteria

### Réalisation de la tâche (compétence pragmatique)

- En dessous du niveau ciblé: writes a series of simple on-topic sentences, but not enough to answer the task effectively. Gives an opinion, but unclear writing and a lack of examples make the meaning or information hard to access.
- Au niveau ciblé B1: writes a connected, non-complex text that broadly meets the task requirements. Gives an opinion and justifies it with a few examples.
- Au niveau ciblé B1+: writes a clear text fully matching the task. Supports the opinion with concrete examples, and may even develop a simple argument to justify it.

Also check that the text type and the topic match the prompt, that the text meets the minimum length, and that it describes facts, past events or personal experiences where the prompt asks for them.

### Cohérence et cohésion (compétence pragmatique)

- En dessous du niveau ciblé: writes simple sentences and links them with basic connectors, or by topic or time order, most of the time. Layout and punctuation sometimes get in the way of understanding.
- Au niveau ciblé B1: writes a connected text using appropriate connectors. Layout and punctuation are used well most of the time.
- Au niveau ciblé B1+: writes a clear, well-organized text with varied connectors. Layout and punctuation are used well and usually make the text easier to understand.

### Adéquation sociolinguistique (compétence sociolinguistique)

- En dessous du niveau ciblé: broadly adapts the text to the situation and the reader, but confusions of expression or register are frequent.
- Au niveau ciblé B1: uses the most common expressions and speech acts (greeting, thanking, closing, etc.) in a register broadly suited to the situation and reader, despite occasional slips.
- Au niveau ciblé B1+: adapts the text to the reader and to the register of the task. Any register slips are rare and do not create tension for the reader.

### Lexique (compétence linguistique: vocabulary range, control and spelling)

- En dessous du niveau ciblé: vocabulary covers basic communication needs but is too narrow for topics beyond personal interests and immediate surroundings. Basic words are spelled correctly, other words are spelled phonetically.
- Au niveau ciblé B1: correctly uses a wide range of everyday vocabulary on familiar topics and predictable daily situations. Can paraphrase to express more complex ideas or words on most topics related to daily life. Errors in word use and spelling appear when expressing more complex ideas.
- Au niveau ciblé B1+: vocabulary is wide enough to communicate without many limits on topics of personal interest and common social issues, and to handle unexpected everyday situations. Can vary wording, though some repetition and gaps may remain. Spelling is accurate enough to be followed easily.

### Morphosyntaxe (compétence linguistique: grammar)

- En dessous du niveau ciblé: uses simple structures and grammatical forms correctly, but still makes basic errors, especially when attempting more complex structures.
- Au niveau ciblé B1: controls simple structures and forms, and is relatively accurate with common complex structures.
- Au niveau ciblé B1+: good grammatical control of the most frequent complex structures and forms, although these are not very varied.

## Anomalies

Report every anomaly that applies. The score caps they lead to are applied automatically, so grade each criterion on what the text shows.

- Hors-sujet thématique: the text type is right, but the topic is wrong.
- Hors-sujet discursif: the topic is right, but the text type is wrong (for example an essay instead of an email).
- Hors-sujet complet: both the topic and the text type are wrong. Report it instead of the two anomalies above.`,
} as const satisfies Rubric;
