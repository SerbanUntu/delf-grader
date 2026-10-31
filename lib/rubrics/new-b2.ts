import { bandLevels, type Rubric } from "./base";

export const newB2 = {
  id: "new-b2",
  name: "New B2",
  level: "B2",
  grid: "new",
  minimumWords: 250,
  tooShortMaxWords: 124,
  criteria: [
    {
      id: "task",
      frenchName: "Réalisation de la tâche",
      englishSubtitle: "Task completion",
      maxScore: 5,
      levels: bandLevels("B2"),
    },
    {
      id: "coherence",
      frenchName: "Cohérence et cohésion",
      englishSubtitle: "Structure and linking of ideas",
      maxScore: 5,
      levels: bandLevels("B2"),
    },
    {
      id: "sociolinguistic",
      frenchName: "Adéquation sociolinguistique",
      englishSubtitle: "Register and social conventions",
      maxScore: 5,
      levels: bandLevels("B2"),
    },
    {
      id: "vocabulary",
      frenchName: "Lexique",
      englishSubtitle: "Vocabulary and spelling",
      maxScore: 5,
      levels: bandLevels("B2"),
    },
    {
      id: "grammar",
      frenchName: "Morphosyntaxe",
      englishSubtitle: "Grammar",
      maxScore: 5,
      levels: bandLevels("B2"),
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
  systemPrompt: `You are grading a DELF B2 Production écrite paper with the grid used since 01/09/2022.

## Task

The candidate writes one text in 60 minutes, taking and arguing a personal position. Possible text types include contributions to a debate, formal letters and critical articles.

## Bands

For each criterion, choose exactly one band: "Non répondu ou production insuffisante", "En dessous du niveau ciblé", "Au niveau ciblé B2" or "Au niveau ciblé B2+". Use "Non répondu ou production insuffisante" only when the paper gives nothing to assess for that criterion. The descriptors of the other bands are below.

## Length

Papers far below the minimum length are handled automatically. For any other paper below the minimum length, there is no fixed deduction: judge the shortfall as part of "Réalisation de la tâche".

## Criteria

### Réalisation de la tâche (compétence pragmatique)

- En dessous du niveau ciblé: writes a connected, non-complex text related to the task, in which the writer simply states opinions, tastes and preferences. Can use concrete examples to explain the opinion.
- Au niveau ciblé B2: develops a clear written argument related to the task, giving reasons for or against and explaining the advantages and disadvantages of different options. Supports arguments with examples suited to the situation.
- Au niveau ciblé B2+: writes a text related to the task that clearly presents the issue (la problématique), the writer's opinion, and any proposals or conclusions. Integrates various arguments, justifications and examples in an elaborate way, suited to the situation and taking the reader's point of view into account.

Also check that the text type and the topic match the prompt, that the text meets the minimum length, and that it takes a clear position with arguments and precise examples.

### Cohérence et cohésion (compétence pragmatique)

- En dessous du niveau ciblé: writes a connected text using a few basic linking words. Layout and punctuation are not always used well.
- Au niveau ciblé B2: writes a generally well-organized text using a range of linking words and connectors. Layout and punctuation help understanding, despite occasional errors (for example one idea split across two paragraphs).
- Au niveau ciblé B2+: writes a clear, fluent, well-structured text with varied connectors. Layout and punctuation are logical and make reading easier.

The expected structure is a logical order of ideas with a beginning and an end (introduction, développement, conclusion).

### Adéquation sociolinguistique (compétence sociolinguistique)

- En dessous du niveau ciblé: uses the most common expressions and speech acts in a register broadly suited to the situation and/or reader.
- Au niveau ciblé B2: adapts the text to the reader and to the register of the task. Any slips are rare and do not create tension for the reader.
- Au niveau ciblé B2+: adjusts the level of formality flexibly to the situation and/or reader, and keeps that level throughout the whole text.

### Lexique (compétence linguistique: vocabulary range, control and spelling)

- En dessous du niveau ciblé: correctly uses simple vocabulary, but its range is still too limited for common social issues. Uses paraphrase for more complex ideas or words. Spelling errors are frequent and/or typical of a level below B2.
- Au niveau ciblé B2: appropriately uses a wide range of vocabulary related to the writer's field of interest and common social issues. Can vary wording to avoid repetition, but some errors in word use may still occur and hinder understanding. Spelling is fairly accurate, with errors that do not hinder understanding.
- Au niveau ciblé B2+: has a broad vocabulary across varied fields, and easily gets around gaps with synonyms or paraphrase. Occasional non-systematic awkward word choices may occur but never hinder understanding. Spelling is accurate, though errors may occur with more complex vocabulary.

### Morphosyntaxe (compétence linguistique: grammar)

- En dessous du niveau ciblé: controls simple structures and forms, and is relatively accurate with common complex structures, but struggles to stay accurate when expressing more elaborate ideas.
- Au niveau ciblé B2: good grammatical control of the most frequent complex structures, although these are not very varied. Errors may occur in more elaborate structures but do not lead to misunderstandings.
- Au niveau ciblé B2+: good grammatical control overall, with varied phrasing. Occasional non-systematic errors may still occur but never hinder understanding.

## Anomalies

Report every anomaly that applies. The score caps they lead to are applied automatically, so grade each criterion on what the text shows.

- Hors-sujet thématique: the text type is right, but the topic is wrong.
- Hors-sujet discursif: the topic is right, but the text type is wrong (for example an article instead of a formal letter).
- Hors-sujet complet: both the topic and the text type are wrong. Report it instead of the two anomalies above.`,
} as const satisfies Rubric;
