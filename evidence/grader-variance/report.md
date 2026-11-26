# Grader variance

Measured on 26/11/2026 for #24, which makes the grader compare the paper with the descriptors, pick a level and only then list deductions, adds tie-break rules (see "Choosing levels and scores" in `docs/RUBRICS.md`) and raises the effort of Claude Opus 5.5 from its default (`medium`) to `high`.

## Setup

- Paper: `examples/handwritten_answer.jpeg`, with the question in `examples/example_question.txt`.
- Transcription: the one saved by the app for this paper on the development deployment, copied to `evidence/grader-variance/transcription.txt` (284 words). Every run grades this same text, so only the grader varies.
- Rubric: New B2.
- Model: `claude-opus-5-5` through the AI SDK, exactly as the app calls it (the `gradeText` function of `convex/grading.ts`, run outside Convex).
- Before: the code of commit `90b4a4e`. After: the code of this change.
- 5 runs each, one after the other. The script that ran them is not committed.

## Results

### Before

| Run | Réalisation de la tâche | Cohérence et cohésion | Adéquation sociolinguistique | Lexique | Morphosyntaxe | Total |
| --- | ----------------------- | --------------------- | ---------------------------- | ------- | ------------- | ----- |
| 1   | 3                       | 5                     | 5                            | 5       | 5             | 23    |
| 2   | 3                       | 5                     | 5                            | 3       | 3             | 19    |
| 3   | 3                       | 5                     | 5                            | 5       | 5             | 23    |
| 4   | 3                       | 5                     | 5                            | 5       | 5             | 23    |
| 5   | 3                       | 5                     | 5                            | 3       | 5             | 21    |

### After

| Run | Réalisation de la tâche | Cohérence et cohésion | Adéquation sociolinguistique | Lexique | Morphosyntaxe | Total |
| --- | ----------------------- | --------------------- | ---------------------------- | ------- | ------------- | ----- |
| 1   | 5                       | 5                     | 5                            | 5       | 5             | 25    |
| 2   | 5                       | 5                     | 5                            | 5       | 5             | 25    |
| 3   | 5                       | 5                     | 5                            | 5       | 5             | 25    |
| 4   | 5                       | 5                     | 5                            | 5       | 5             | 25    |
| 5   | 5                       | 5                     | 5                            | 3       | 5             | 23    |

### Spread

Range is the highest score minus the lowest. The standard deviation is the sample standard deviation over the 5 runs.

| Criterion                    | Range before | Range after | Standard deviation before | Standard deviation after | Mean before | Mean after |
| ---------------------------- | ------------ | ----------- | ------------------------- | ------------------------ | ----------- | ---------- |
| Réalisation de la tâche      | 0            | 0           | 0                         | 0                        | 3           | 5          |
| Cohérence et cohésion        | 0            | 0           | 0                         | 0                        | 5           | 5          |
| Adéquation sociolinguistique | 0            | 0           | 0                         | 0                        | 5           | 5          |
| Lexique                      | 2            | 2           | 1.1                       | 0.89                     | 4.2         | 4.6        |
| Morphosyntaxe                | 2            | 0           | 0.89                      | 0                        | 4.6         | 5          |
| Total                        | 4            | 2           | 1.79                      | 0.89                     | 21.8        | 24.6       |

### Cost and time

Every run was accepted on the first attempt. Costs are estimated from the token usage of each response at the list prices of Claude Opus 5.5 (4 USD per million input tokens, 5 for cache writes, 0.20 for cache reads and 20 for output tokens).

|                       | Before   | After     |
| --------------------- | -------- | --------- |
| Output tokens per run | 770-1073 | 1640-2062 |
| Time per run          | 10-18 s  | 15-18 s   |
| Cost of the 5 runs    | 0.14 USD | 0.24 USD  |

## Observations

- The spread of the total halved: a range of 4 points became 2, and the standard deviation went from 1.79 to 0.89. Morphosyntaxe became stable. Lexique still moves between 3 and 5 in one run out of 5, for the same reason as before (the grader is torn on whether repeated words such as "photo", "publier" and "personnes" keep the paper below B2+).
- The scores also moved up by 2.8 points on average. Réalisation de la tâche went from 3 in every run to 5 in every run. Before, the grader removed 2 points in each run because only one of the examples is a real bad experience ("un ami à moi a publié une photo de lui devant son école") and the others are hypothetical. After, it checks the points of the B2+ descriptor one by one, finds them all met, and gives B2+ as the official manual asks ("Ne pas hésiter à attribuer le maximum des points quand la compétence du candidat correspond au descripteur du critère évalué"). Whether 5 or 3 is right for this paper is a question for an examiner, as this measurement only covers consistency.
- For comparison, the official manual asks the head of the exam centre to review a paper when the two human examiners are more than 6 points apart (`docs/RUBRICS.md`, source 1, section 3).
- This is one paper, 5 runs per version, with the New B2 rubric only. The Pre-Sept. 2022 grids were not measured.

## Files

- `transcription.txt`: the graded text.
- `before/run-N.json` and `after/run-N.json`: one file per run, with the time, the stored grading result, and every request sent to the Anthropic API and its full response (API keys are not recorded). In the after runs, each response also holds the grader's comparison for every criterion, which the app does not store.
