# DELF Production Écrite Rubrics

These are the four fixed rubrics supported by the application. The structure of each rubric (criteria, maximum points, allowed scores, level labels, length thresholds and anomaly caps) is encoded as typed data in code. The descriptions and grading explanations below are the basis for the system prompt stored with each rubric.

## Choosing levels and scores

The grader follows these rules so that the same paper gets the same score every time. For each criterion, it first compares the paper with the descriptors, then picks a level (an allowed score), then lists the deductions that explain the gap to the maximum.

### Rules for every grid

- Judge what the paper shows the student can do (évaluation positive), against the level the grid targets. Mistakes only matter as far as a descriptor mentions them [3].
- Grade only with the grid's criteria, each on what it covers [3]. The same mistake is never counted under two criteria.
- When the paper meets the descriptor, give the score without hesitating ("Ne pas hésiter à attribuer le maximum des points quand la compétence du candidat correspond au descripteur du critère évalué" [1], section 3).
- When torn between two levels or scores, choose the lower one. This rule is the app's own: the guides tell an examiner in doubt to consult another examiner and then the head of the exam centre [1], section 1.3, which the grader cannot do.
- Errors in how a word is spelled in the dictionary, including accents ("chateau", "etudiant"), belong to the vocabulary or spelling criterion. Errors in agreement and conjugation ("un séjour magnifiques"), and wrong articles ("le table"), belong to the grammar criterion [1], sections 5.2 and 5.3.
- A text longer than the minimum is never penalized [1], section 5.1.

### New grids

The new grids use an approach "par niveau de performance" [2], [4]. For each criterion:

1. Split each level's descriptor into its separate points. A paper reaches a level when it meets every point, read with the tolerance the descriptor gives (for example "malgré des erreurs ponctuelles").
2. Check the target level (B1 or B2) first. If the paper reaches it, check B1+ or B2+. If not, the level is "En dessous du niveau ciblé".
3. Give B1+ or B2+ only when the paper meets every point of its descriptor, and then without hesitating, as it does not mean a flawless text.
4. A point the grader cannot confirm counts as not met.
5. "Non répondu ou production insuffisante" is only for a criterion with nothing to assess.

### Pre-Sept. 2022 grids

Each descriptor states what is expected at the target level. To keep half-point scores consistent, the grader only uses five steps, as a share of the criterion's maximum, rounded down to the nearest 0.5:

| Step           | When                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Maximum        | The paper meets every point of the descriptor                                                                         |
| Three quarters | The paper meets the descriptor overall, with a few shortfalls that do not get in the way of the reader                |
| Half           | The paper meets the descriptor only in part, with frequent shortfalls or shortfalls that get in the way of the reader |
| One quarter    | The paper falls clearly short and meets only a few points of the descriptor                                           |
| 0              | Nothing to assess for this criterion                                                                                  |

Rules from the examiner's manual [1] for these grids:

- A requested point that the paper leaves out (for example forgetting to say what one will bring to a picnic) is penalized under "Capacité à présenter des faits", not "Respect de la consigne" (section 5.1).
- The score of "Maîtrise du vocabulaire" cannot be higher than the score of "Étendue du vocabulaire" (section 5.4).
- At B1, the number of facts or opinions expected is in proportion to the required number of words (section 6.3). The new B1 grid follows the same rule.

## (Pre-Sept. 2022) B1

DELF B1 Production écrite grid used until 31/08/2022.

### Task format

- Duration: 45 minutes
- One text only
- Task: express a personal attitude on a general topic
- Text types: essay, letter, article, email, forum post, etc.
- Minimum length: 160 words
- Total score: 25 points
- Pass rule for the whole exam: at least 5/25 in this section and at least 50/100 overall

### Word counting rule

- A word is any group of characters between two spaces
- "j'ai" = 1 word
- "rendez-vous" = 1 word
- "Je mange une pomme" = 4 words

### Scoring mechanics

- 10 criteria, each scored independently
- Every criterion is scored in 0.5 point steps, from 0 up to its maximum
- Final score = sum of all 10 criteria

### Part 1: Task and discourse (13 points)

#### 1. Respect de la consigne (0 to 2)

Made of two sub-parts worth 1 point each:
- Situation (0 to 1): the text fits the situation in the prompt (right topic, right text type, right reader)
- Length (0 to 1), fixed rule:
  - 144 words or more: 1
  - 113 to 143 words: 0.5
  - 112 words or fewer: 0

#### 2. Capacité à présenter des faits (0 to 4)

Can describe facts, events or experiences.

#### 3. Capacité à exprimer sa pensée (0 to 4)

Can present ideas, feelings and/or reactions, and give an opinion.

#### 4. Cohérence et cohésion (0 to 3)

Can link a series of short, simple, separate elements into a connected text.

### Part 2: Compétence lexicale / orthographe lexicale (6 points)

#### 5. Étendue du vocabulaire (0 to 2)

Has enough vocabulary to write about everyday topics, using paraphrase when needed.

#### 6. Maîtrise du vocabulaire (0 to 2)

Good control of basic vocabulary, but serious errors still occur when expressing more complex ideas.

#### 7. Maîtrise de l'orthographe lexicale (0 to 2)

Spelling of words, punctuation and layout are accurate enough to be followed easily most of the time.

### Part 3: Compétence grammaticale / orthographe grammaticale (6 points)

#### 8. Degré d'élaboration des phrases (0 to 2)

Good command of simple sentence structure and of the most common complex sentences.

#### 9. Choix des temps et des modes (0 to 2)

Good control of tenses and moods, despite clear influence of the native language.

#### 10. Morphosyntaxe - orthographe grammaticale (0 to 2)

Gender and number agreement, pronouns, verb endings, etc.

### Special cases

- Blank paper: 0 on all criteria
- Length is penalized ONLY through the length sub-part of criterion 1. There is no other automatic zero for short texts.
- Off-topic papers: flag for review

## (Pre-Sept. 2022) B2

DELF B2 Production écrite grid used until 31/08/2022.

### Task format

- Duration: 60 minutes
- One text only
- Task: argued personal position
- Text types: contribution to a debate, formal letter, critical article, etc.
- Minimum length: 250 words
- Total score: 25 points
- Pass rule for the whole exam: at least 5/25 in this section and at least 50/100 overall

### Word counting rule

- A word is any group of characters between two spaces
- "j'ai" = 1 word
- "rendez-vous" = 1 word
- "Je mange une pomme" = 4 words

### Scoring mechanics

- 10 criteria, each scored independently
- Every criterion is scored in 0.5 point steps, from 0 up to its maximum
- Final score = sum of all 10 criteria

### Part 1: Task, sociolinguistic and discourse (14 points)

#### 1. Respect de la consigne (0 to 2)

Made of two sub-parts worth 1 point each:
- Situation (0 to 1): respects the situation and the type of text requested
- Length (0 to 1), fixed rule:
  - 225 words or more: 1
  - 176 to 224 words: 0.5
  - 175 words or fewer: 0

#### 2. Correction sociolinguistique (0 to 2)

Can adapt the text to the situation and the reader, and use the level of formality the circumstances call for. Graders check:
- opening and closing formulas (for formal letters)
- register (vocabulary, syntax, style)

#### 3. Capacité à présenter des faits (0 to 3)

Can describe facts, events or situations clearly and precisely.
Example: when writing to a school director to request changes, the writer must describe the current situation that motivates the request.

#### 4. Capacité à argumenter une prise de position (0 to 3)

Can develop an argument that highlights the important points and relevant details appropriately.

#### 5. Cohérence et cohésion (0 to 4)

- Can clearly link ideas into a fluent, coherent text
- Follows layout conventions
- Punctuation is fairly accurate but may show native-language influence

### Part 2: Compétence lexicale / orthographe lexicale (5 points)

#### 6. Étendue du vocabulaire (0 to 2)

Uses a fairly wide range of vocabulary, despite occasional gaps that lead to paraphrasing.

#### 7. Maîtrise du vocabulaire (0 to 2)

Vocabulary is generally appropriate. Confusions and wrong word choices occur but do not block communication.

#### 8. Maîtrise de l'orthographe (0 to 1)

- Produces a continuous, clear and understandable text
- Spelling is fairly accurate but may show native-language influence
- Can spell most words expected at this level correctly

Spelling errors in word forms (e.g. "vancance") are penalized here. Grammatical spelling errors (e.g. "trois sac") are penalized under criterion 9.

### Part 3: Compétence grammaticale / orthographe grammaticale (6 points)

#### 9. Choix des formes (0 to 4)

Good grammatical control. Non-systematic errors may still occur but do not cause misunderstandings. Graders check:
- the expected tenses and moods for the task (e.g. future, conditional or subjunctive when making proposals)
- sequence of tenses (concordance des temps)
- morphosyntax (verb endings, gender and number agreement, pronominal constructions, etc.)

#### 10. Degré d'élaboration des phrases (0 to 2)

Uses a variety of sentence constructions appropriately.

### Special cases

- Blank paper: 0 on all criteria
- Length is penalized ONLY through the length sub-part of criterion 1. There is no other automatic zero for short texts.
- Off-topic papers: flag for review

## New B1

DELF B1 Production écrite grid used since 01/09/2022.

### Task format

- Duration: 45 minutes
- One text only
- Task: express a personal attitude on a general topic
- Text types: essay, letter, article, email, forum post, etc.
- Minimum length: 160 words
- Total score: 25 points
- Pass rule for the whole exam: at least 5/25 in this section and at least 50/100 overall

### Word counting rule

- A word is any group of characters between two spaces
- "j'ai" = 1 word
- "rendez-vous" = 1 word
- "Je mange une pomme" = 4 words

### Scoring mechanics

- 5 criteria
- For each criterion, choose exactly ONE band:

| Band | Label                                  | Points |
| ---- | -------------------------------------- | ------ |
| 0    | Non répondu ou production insuffisante | 0      |
| 1    | En dessous du niveau ciblé             | 1      |
| 2    | Au niveau ciblé B1                     | 3      |
| 3    | Au niveau ciblé B1+                    | 5      |
- No other values are allowed (no 2, no 4, no half points)
- Final score = sum of the 5 criteria, max 25
- Apply the anomaly rules BEFORE choosing bands

### Criteria and band descriptors

#### 1. Réalisation de la tâche (compétence pragmatique)

- Below: writes a series of simple on-topic sentences, but not enough to answer the task effectively. Gives an opinion, but unclear writing and a lack of examples make the meaning or information hard to access.
- B1: writes a connected, non-complex text that broadly meets the task requirements. Gives an opinion and justifies it with a few examples.
- B1+: writes a clear text fully matching the task. Supports the opinion with concrete examples, and may even develop a simple argument to justify it.
- Also check: the text type matches the prompt (email, letter, etc.), the topic matches the prompt, the text meets the minimum length, and it describes facts, past events or personal experiences where the prompt asks for them.

#### 2. Cohérence et cohésion (compétence pragmatique)

- Below: writes simple sentences and links them with basic connectors, or by topic or time order, most of the time. Layout and punctuation sometimes get in the way of understanding.
- B1: writes a connected text using appropriate connectors. Layout and punctuation are used well most of the time.
- B1+: writes a clear, well-organized text with varied connectors. Layout and punctuation are used well and usually make the text easier to understand.

#### 3. Adéquation sociolinguistique (compétence sociolinguistique)

- Below: broadly adapts the text to the situation and the reader, but confusions of expression or register are frequent.
- B1: uses the most common expressions and speech acts (greeting, thanking, closing, etc.) in a register broadly suited to the situation and reader, despite occasional slips.
- B1+: adapts the text to the reader and to the register of the task. Any register slips are rare and do not create tension for the reader.

#### 4. Lexique (compétence linguistique: vocabulary range, control and spelling)

- Below: vocabulary covers basic communication needs but is too narrow for topics beyond personal interests and immediate surroundings. Basic words are spelled correctly, other words are spelled phonetically.
- B1: correctly uses a wide range of everyday vocabulary on familiar topics and predictable daily situations. Can paraphrase to express more complex ideas or words on most topics related to daily life. Errors in word use and spelling appear when expressing more complex ideas.
- B1+: vocabulary is wide enough to communicate without many limits on topics of personal interest and common social issues, and to handle unexpected everyday situations. Can vary wording, though some repetition and gaps may remain. Spelling is accurate enough to be followed easily.

#### 5. Morphosyntaxe (compétence linguistique: grammar)

- Below: uses simple structures and grammatical forms correctly, but still makes basic errors, especially when attempting more complex structures.
- B1: controls simple structures and forms, and is relatively accurate with common complex structures.
- B1+: good grammatical control of the most frequent complex structures and forms, although these are not very varied.

### Anomaly rules

- Manque de matière évaluable (too short): 79 words or fewer (under 50% of 160): 0 on ALL criteria. Stop.
- Copie blanche (blank paper): 0 on ALL criteria. Stop.
- Hors-sujet thématique (right text type, wrong topic): "Réalisation de la tâche" and "Lexique" cannot be B1+ (max 3 points each).
- Hors-sujet discursif (right topic, wrong text type, e.g. an essay instead of an email): "Réalisation de la tâche" and "Cohérence et cohésion" cannot be B1 or B1+ (max 1 point each).
- Hors-sujet complet (wrong topic AND wrong text type): 0 for "Réalisation de la tâche", "Cohérence et cohésion" and "Adéquation sociolinguistique". "Lexique" and "Morphosyntaxe" cannot be B1 or B1+ (max 1 point each).
- More than one anomaly can be checked. Apply all caps that result.

### Other notes

- Between 80 and 159 words, there is no fixed deduction. Falling short of 160 words is judged as part of "Réalisation de la tâche".

## New B2

DELF B2 Production écrite grid used since 01/09/2022.

### Task format

- Duration: 60 minutes
- One text only
- Task: argued personal position
- Text types: contribution to a debate, formal letter, critical article, etc.
- Minimum length: 250 words
- Total score: 25 points
- Pass rule for the whole exam: at least 5/25 in this section and at least 50/100 overall

### Word counting rule

- A word is any group of characters between two spaces
- "j'ai" = 1 word
- "rendez-vous" = 1 word
- "Je mange une pomme" = 4 words

### Scoring mechanics

- 5 criteria
- For each criterion, choose exactly ONE band:

| Band | Label                                  | Points |
| ---- | -------------------------------------- | ------ |
| 0    | Non répondu ou production insuffisante | 0      |
| 1    | En dessous du niveau ciblé             | 1      |
| 2    | Au niveau ciblé B2                     | 3      |
| 3    | Au niveau ciblé B2+                    | 5      |
- No other values are allowed (no 2, no 4, no half points)
- Final score = sum of the 5 criteria, max 25
- Apply the anomaly rules BEFORE choosing bands

### Criteria and band descriptors

#### 1. Réalisation de la tâche (compétence pragmatique)

- Below: writes a connected, non-complex text related to the task, in which the writer simply states opinions, tastes and preferences. Can use concrete examples to explain the opinion.
- B2: develops a clear written argument related to the task, giving reasons for or against and explaining the advantages and disadvantages of different options. Supports arguments with examples suited to the situation.
- B2+: writes a text related to the task that clearly presents the issue (la problématique), the writer's opinion, and any proposals or conclusions. Integrates various arguments, justifications and examples in an elaborate way, suited to the situation and taking the reader's point of view into account.
- Also check: the text type matches the prompt, the topic matches the prompt, the text meets the minimum length, and it takes a clear position with arguments and precise examples.

#### 2. Cohérence et cohésion (compétence pragmatique)

- Below: writes a connected text using a few basic linking words. Layout and punctuation are not always used well.
- B2: writes a generally well-organized text using a range of linking words and connectors. Layout and punctuation help understanding, despite occasional errors (e.g. one idea split across two paragraphs).
- B2+: writes a clear, fluent, well-structured text with varied connectors. Layout and punctuation are logical and make reading easier.
- Expected structure: logical order of ideas with a beginning and an end (introduction, développement, conclusion).

#### 3. Adéquation sociolinguistique (compétence sociolinguistique)

- Below: uses the most common expressions and speech acts in a register broadly suited to the situation and/or reader.
- B2: adapts the text to the reader and to the register of the task. Any slips are rare and do not create tension for the reader.
- B2+: adjusts the level of formality flexibly to the situation and/or reader, and keeps that level throughout the whole text.

#### 4. Lexique (compétence linguistique: vocabulary range, control and spelling)

- Below: correctly uses simple vocabulary, but its range is still too limited for common social issues. Uses paraphrase for more complex ideas or words. Spelling errors are frequent and/or typical of a level below B2.
- B2: appropriately uses a wide range of vocabulary related to the writer's field of interest and common social issues. Can vary wording to avoid repetition, but some errors in word use may still occur and hinder understanding. Spelling is fairly accurate, with errors that do not hinder understanding.
- B2+: has a broad vocabulary across varied fields, and easily gets around gaps with synonyms or paraphrase. Occasional non-systematic awkward word choices may occur but never hinder understanding. Spelling is accurate, though errors may occur with more complex vocabulary.

#### 5. Morphosyntaxe (compétence linguistique: grammar)

- Below: controls simple structures and forms, and is relatively accurate with common complex structures, but struggles to stay accurate when expressing more elaborate ideas.
- B2: good grammatical control of the most frequent complex structures, although these are not very varied. Errors may occur in more elaborate structures but do not lead to misunderstandings.
- B2+: good grammatical control overall, with varied phrasing. Occasional non-systematic errors may still occur but never hinder understanding.

### Anomaly rules

- Manque de matière évaluable (too short): 124 words or fewer (under 50% of 250): 0 on ALL criteria. Stop.
- Copie blanche (blank paper): 0 on ALL criteria. Stop.
- Hors-sujet thématique (right text type, wrong topic): "Réalisation de la tâche" and "Lexique" cannot be B2+ (max 3 points each).
- Hors-sujet discursif (right topic, wrong text type, e.g. an article instead of a formal letter): "Réalisation de la tâche" and "Cohérence et cohésion" cannot be B2 or B2+ (max 1 point each).
- Hors-sujet complet (wrong topic AND wrong text type): 0 for "Réalisation de la tâche", "Cohérence et cohésion" and "Adéquation sociolinguistique". "Lexique" and "Morphosyntaxe" cannot be B2 or B2+ (max 1 point each).
- More than one anomaly can be checked. Apply all caps that result.

### Other notes

- Between 125 and 249 words, there is no fixed deduction. Falling short of 250 words is judged as part of "Réalisation de la tâche".

## Sources

1. CIEP, Bureau DELF DALF, "Manuel de l'examinateur-correcteur du DELF et du DALF", version H bis, Sèvres, January 2015. Copy at https://languageadvisor.net/wp-content/uploads/2022/05/Manuel-de-lexaminateur-correcteur-du-DELF-et-du-DALF-PDFDrive-.pdf
2. France Éducation international, "DELF B2, grille d'évaluation de la production écrite" and "descripteurs de performance de la production écrite" (new grid), https://france-education-international.fr/document/grille-pe-b2, and the B1 grid at https://delfdalf.ch/fileadmin/user_upload/Nouvelles_Grilles/Grille_PE_B1.pdf
3. CIEP, "DELF Prim A1.1, notice d'utilisation des grilles d'évaluation", 2015: "Tout comme le DELF, le DELF Prim est basé sur une évaluation positive" and "L'évaluation doit être effectuée exclusivement en fonction de ces critères". https://www.delfdalf.ch/fileadmin/user_upload/Unterlagen/Exemples_examens/A1/A1_1/2018_uploads/DELF_A11_notice_d_utilisation_des_grilles.pdf
4. DELF DALF Suisse, "Nouvelles grilles d'évaluation": "Les nouvelles grilles proposent une approche par niveau de performance". https://www.delfdalf.ch/nouvelles-grilles-devaluation
