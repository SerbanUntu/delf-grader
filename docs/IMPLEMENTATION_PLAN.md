# Implementation Plan

Everything in this plan is in scope for the current milestone, except items marked "Post-Milestone 3", which are collected in the last section and must not be implemented yet.

## Cleanup

- Remove the current scaffolding: the template home page, the sample Convex functions and the sample Convex schema.
- Keep the shadcn/ui setup.

## Accounts and access

- Authentication uses Clerk with email and password (already configured).
- Sign-up is public.
- Signed-out visitors are redirected to the sign-in page.
- Each teacher only ever sees and edits their own data. Every Convex function checks that the signed-in teacher owns the data it reads or writes.

## Visual design and general UI

- Use a modern, minimalist light theme with a curry yellow accent color (around `#C9A227`). There is no dark mode.
- Use the accent color for accents and fills only, never for body text, because yellow on white is hard to read.
- Everything must be clearly legible, including for users without excellent vision. The base font size is 16px.
- Make very light use of gradients and animations.
- The website is designed for laptops. It does not need to look polished on phones or tablets, but nothing may be broken there: everything must still be visible and usable on screens down to 360px wide. Do not design mobile-first, and prefer simple code over phone-specific layouts.
- All UI text is in English, except DELF terms such as "DELF", "Production écrite" and the rubric criterion names. Users know French, but the developers and testers of the app do not, so French criterion names have a short English subtitle. The text the grader writes and the exported feedback are the exception, as they are read by students and follow the feedback language (see "Feedback language").
- Dates are shown as `31/12/1999`. Decimal numbers use a decimal point (`17.5`).
- Every page has a header with the logo, a "?" button (see "Student identity"), Clerk's user button and breadcrumbs (Classes > class > session > submission).
- Every destructive action (deleting, or saving a change that re-runs later steps) asks for confirmation in a dialog.

## Branding and search engines

- Name: "DELF Grader". Tagline: "AI-assisted automated grader of DELF Production Écrite handwritten answers". Description (used as the meta description): "A Next.js app that automatically transcribes and grades DELF Production Écrite handwritten papers using AI."
- The site has a tab icon, the logo in the header, and one static social card image used for every page, since all pages except sign-in are private.
- Tab titles change with the page: "<item name> - DELF Grader", for example "Practice Exam - DELF Grader", "Classes - DELF Grader" on the home page and "Sign in - DELF Grader". Student names never appear in tab titles, because titles are kept in the browser history.
- Search engines may index the sign-in page. Every other page is marked `noindex` and disallowed in `robots.txt`, and `sitemap.xml` lists only the sign-in page.
- The metadata is defined once in the root layout, so a public landing page (#34) can later be added at a public route and listed in the sitemap without restructuring.

## Classes, sessions and submissions

### Classes

- Each teacher has a list of classes. Classes are not tied to a school year or grade, because a teacher may teach the same class for several years (usually 4 or 8, but any number from 1 to 8).
- A class only has a name, which is required. The name field has the placeholder "Clasa a IX-a Z".
- A class contains both sessions and individual submissions.

### Sessions

- A session is one instance of the whole class taking a practice exam. All submissions in a session share the same rubric and exam question.
- Creating a session asks for:
  - Exam date: required, defaults to today.
  - Rubric: required, chosen from the fixed rubrics.
  - Exam question: required, pasted as text.
  - Name: optional. The placeholder shows the name that will be used if the field is left empty: "<class name> - <exam date>", using the actual class name and exam date, or "Clasa a IX-a Z" and "31/12/1999" for parts that are not filled in yet.
- The rubric and question of a session can be changed later. If any submission has already been graded, saving the change opens a dialog stating that all graded submissions in the session will be re-graded, and the change is only applied after the teacher clicks "Yes".

### Individual submissions

- An individual submission is a one-off exam taken by a single student, outside of any session.
- It asks for the same fields as a session (exam date, rubric, exam question), plus the submission fields below.

### Submission fields

- Student name: optional, never prefilled. See "Student identity" for how it is stored.
- Submission name: prefilled with "Practice Exam", which is also the placeholder and the value used when the field is left empty. A hint under the field says "Do not include student names", because the submission name is saved on the server.
- Teachers mostly recognize a submission by its student name and exam date, so both are shown wherever the submission appears, including its card.

### Editing and deleting

- Classes, sessions and submissions can be renamed and deleted.
- Deleting asks for confirmation and deletes everything inside the item (a class with its sessions and submissions, a session with its submissions).
- There is no archiving, and submissions cannot be moved between sessions or classes.

## Pages and cards

### Pages

- Home page: a grid of class cards and a "New class" button.
- Class page: two separate sections, "Sessions" and "Individual submissions", each with a grid of cards and a button to create a new item. A third section, "Students", is described in "Student analytics", and a fourth, "Analytics", in "Class analytics".
- Session page: two tabs, "Submissions" (a grid of submission cards and an "Add submission" button) and "Analytics" (see "Session analytics"). The session's name, exam date, rubric and question can be viewed and edited from this page.
- Submission page: see "Submission workflow" and "Submission screens".

### Cards

- Every card shows the item's name and, at the bottom, its statistics: a progress circle and the score next to it (for example `17.5/25`).
  - The circle fills to score / 25 and is colored by score: 20 to 25 green, 16 to below 20 yellow, 12 to below 16 orange, below 12 red.
  - The color thresholds and the trend threshold below are defined in exactly one place in the code, so they are easy to change.
  - When there is not enough data (no graded submission), the statistics are greyed out and show "N/A".
- The number shown depends on the card:
  - Class: the median score of the newest session (by exam date) that has at least one graded submission. Individual submissions are not counted.
  - Session: the median score of its graded submissions. Session cards also show the exam date and the number of submissions.
  - Submission: its score. Submission cards also show the student name (read from the browser, or "Student #abcd" (with its id) when it is not known in the current browser) and the exam date.
- Session cards also show the change from the previous session in the same class (by exam date, skipping sessions without any graded submission), when there is one. It is shown as a number of points (for example `+1.5`) with an arrow pointing up-right, down-right or straight right. The arrow points straight right when the change is 0.5 points or less, and only points up-right or down-right when the change is more than 0.5 points.
- Submission cards have a cover image: the first page of the redacted image stored on Convex, so the teacher can easily recognize the exam. Before the redacted image is saved, the card shows the local unredacted image (if it is available in the current browser) with a "Redact to save" badge.
- Submission cards show a status badge while work is in progress or has failed ("Redact to save", "Transcribing", "Grading", "Failed").

### Sorting and filtering

- Every card grid is sorted by newest first by default. A dropdown offers: newest first, oldest first, highest score, lowest score, name A to Z. For submission grids, "name A to Z" sorts by student name, which is done in the browser.
- Every card grid has a score filter with a minimum and a maximum.
- The chosen sorting and filter are remembered per page in local storage.

## Submission workflow

### Steps

A submission goes through four steps:

1. Upload: the teacher picks one or more files holding the student's answer, each an image or a PDF. Images and PDFs can be mixed. The files stay in the browser and are not sent to Convex.
   - A submission can have several pages, kept in order. PDF pages are turned into images in the browser and take the place of their PDF in the order.
   - The picked pages are shown as image cards, followed by an "Add more" card with a plus icon, no background color, a dashed border and the same size as the image cards. It picks more files and adds their pages at the end.
   - The teacher can reorder the pages by dragging their cards and remove a single page.
   - Pages can be added, reordered and removed until the redacted images are saved. After that, the teacher uploads new files to start over (see "Navigating and re-running steps").
   - Limits: 10 pages and 20 MB per submission, counted over all picked files.
   - Unredacted images are kept in the browser's IndexedDB, so they survive a page reload. They are deleted once the redacted version is saved or the submission is deleted. On any other browser, the submission shows a message saying the images are only available on the browser where they were uploaded.
2. Redaction: an in-browser tool to hide personal information.
   - The teacher draws black rectangles on each page, and can undo and delete rectangles. Zooming uses the shared zoom features (see "Zooming into pages").
   - Saving burns the rectangles into the pixels and re-encodes each page as a JPEG, so the hidden data is gone for good and metadata such as GPS location is removed.
   - Only after this step is saved are the images sent to Convex.
   - Redaction is optional and is only a precaution. Most of the time the answer contains only handwritten text without personal information, and the teacher simply saves without drawing anything. Saving asks for no confirmation, and when nothing has been drawn the button reads "Save (no redactions)".
3. Transcription: starts automatically once the redacted images are saved. The transcribed text is then shown in an editable text area with an explicit "Save" button, so the teacher can fix transcription mistakes without changing anything by accident.
4. Grading: starts automatically once transcription is done. A "Re-grade" button runs grading again on the same input and replaces the previous result.

### Navigating and re-running steps

- The steps are shown as a vertical list. Each step is also a button that opens that step's screen, so the teacher can go back to any step that has been reached. Steps that have not been reached yet are disabled.
- Each step shows its status: not started, in progress, done or failed.
- Changing an earlier step after a later step has started always re-runs every later step, and the previous results are replaced. Changes are only applied through an explicit "Save" button, which opens a dialog stating exactly which steps will be re-run. Nothing changes until the teacher clicks "Yes".
- Going back to the upload step and picking new files sends the submission back to the redaction step.
- Going back to the redaction step after the images were saved only allows adding more rectangles to the stored redacted images, because the originals are not kept on the server. To start over, the teacher uploads new files.

### Background processing and errors

- Transcription and grading run on the server, so the teacher can leave the page or close the browser while they run.
- If a step fails, the step and the card show it as failed, and the step's screen shows the error with a "Retry" button.
- There is one grading per submission. There is no history of previous gradings.

## Submission screens

- The transcription and grading screens show the submission image on one side and the step's content on the other side (the transcription text area or the grading result).
- The image side shows the redacted images from Convex. If they are not saved yet, it falls back to the local uploaded images, and then to a blank area saying that the submission will appear there once it is uploaded. Multi-page submissions can be scrolled or paged through.
- The divider between the two sides can be dragged to resize them (shadcn/ui Resizable), and a button in the image side's toolbar switches between side by side (the default) and one above the other. Both choices are remembered in local storage and apply to every screen. Below 768px wide, the two sides are always one above the other.
- The grading screen shows:
  - The total score out of 25 with the colored progress circle.
  - The word count and the text type the grader inferred from the question (for example "Expected text type: lettre formelle").
  - A warning banner for every detected anomaly (for example an off-topic answer or an answer that is too short).
  - The overview of the whole paper.
  - For each criterion: its French name with an English subtitle, the score out of its maximum, the level label for that score, the criterion overview, and the list of deductions (points removed, the reason and, with mistake categories, its categories).
  - The "Re-grade", "Copy feedback" and "Download PDF" buttons.
  - The "Notes" text area at the bottom, below the grading result (see "Notes").

### Notes

- Notes are a plain text area at the bottom of the grading screen. There is no separate notes screen or "Notes" button, so notes can be written once the grading screen is reached.
- Notes exist on submissions only and are kept for future reference. Re-grading or re-running steps keeps them.
- A hint under the field says "Do not include student names", because notes are saved on the server.
- Notes are saved automatically, with a "Saving..." or "Saved automatically" label and no "Save" button. The first change after a save starts a 5-second timer, and further typing does not restart it, so notes are saved at least every 5 seconds while the teacher types continuously. Unsaved changes are also saved when the field loses focus and when the teacher leaves the page.
- Notes are limited to 65536 characters as a safety check, enforced by the field and by the server. There is no character counter.

### Zooming into pages

- Every view that shows a student's page at reading size uses the same zoom features: the redaction editor and the image side of the transcription and grading screens. Small thumbnails, such as card covers and the upload step's page cards, are not included.
- Zooming only changes what is inside the image container. The container keeps its size, and nothing else on the page moves or resizes.
- Standard zoom: zoom in, zoom out and reset buttons, Ctrl + mouse wheel, and pinching on touch screens, from 50% to 400%. When zoomed in, the teacher drags the image to move around it.
- Magnifier: a round lens about 200px wide that follows the cursor and shows the area under it at 2.5 times its size. It is on by default and a button turns it off and on again. The choice is remembered in local storage. It is hidden on touch screens, which have no cursor.
- The zoom level carries over when moving between the pages of a submission.

### Exporting feedback

- The grading screen has a "Copy feedback" button, which copies the feedback as plain text suited to pasting into a messaging app such as WhatsApp, and a "Download PDF" button, which downloads it as a PDF made in the browser with a PDF library.
- The feedback is read by students, so its fixed labels (for example "Note totale") are in the language of its grading result (see "Feedback language"). Everything else appears exactly as in the app, with no translation: criterion, level, anomaly and category names in French, and reasons and overviews in the feedback language.
- It contains the submission name as its title, the exam date, the total score out of 25, the anomalies, the overview of the paper and, for each criterion, its name, score out of its maximum, level label, overview and deductions (points removed, the reason and the categories).
- Notes, the transcription, the images, the student name and the rubric name are not exported, and there is no export of a whole session.
- The PDF file is named "<submission name> - <student name> - 31-12-1999.pdf" (with the exam date), so the teacher can tell the files apart. The student name is only used in the file name, and is left out when it is not known in the current browser. Placeholders such as "Student #a3f9" never appear. Characters that are not allowed in file names are removed.

### Feedback language

- A dropdown right of the "Grading" heading, away from the action buttons, picks the feedback language: English, Romanian or French, each with its flag drawn as a small inline SVG (flag emojis do not render on Windows). French is the default. The choice is kept in local storage and applies to the whole app.
- The browser sends the language with every action that starts or restarts grading, and it is saved on the submission, so the grading that starts after transcription uses it.
- The grader writes reasons and overviews in the feedback language. Quotes of the student's text and DELF terms (criterion, level, anomaly and category names, and the text type) stay in French.
- Fixed text written by code (the export's labels and the reasons of automatic deductions) is translated in code, in maps keyed by language, so adding a language fails to type-check until every map has it.
- Each grading result stores its language, which the export uses so its labels match its text. Results saved before the language was stored are in English.
- Changing the language on a graded submission asks whether to re-grade it in the new language. "Cancel" keeps the current result, and the new language is used from the next grading on.

## Rubrics and grading

### Supported rubrics

- The four fixed rubrics are DELF B1 and B2 Production écrite, in the grids used until 31/08/2022 and the grids used since 01/09/2022. They are described in [RUBRICS.md](RUBRICS.md) and are named in the app:
  - "(Pre-Sept. 2022) B1"
  - "(Pre-Sept. 2022) B2"
  - "New B1"
  - "New B2"

### Rubric data

- The rubrics are the single source of truth for grading. Their structure is fully type-safe and drives the grader's output format, what the grading screen shows, the exported feedback and the analytics.
- Code used by both the Convex backend and the frontend lives in the existing `lib` folder. Each rubric is defined in its own file in `lib/rubrics/`, which holds both its structure and its system prompt. Changing a rubric only requires changing its file. Adding a rubric requires its file plus one line in the type-checked list of all rubrics in `lib/rubrics/index.ts`.
- Everything else (Convex validators, the grader's output schema, the grading screen, the export, analytics) is derived from the rubric data, so any code that must be updated after a change fails to type-check.
- Each rubric holds:
  - An ID, a display name, the CEFR level, the grid (Pre-Sept. 2022 or new) and the minimum word count.
  - The list of criteria. Each criterion has an ID, a French name, a short English subtitle, its maximum points, the list of allowed scores, the level label for each allowed score and its analytics criterion (see "Analytics criteria"). New grids allow only 0, 1, 3 and 5 (labeled with the bands from RUBRICS.md). Pre-Sept. 2022 grids allow every 0.5 step from 0 to the maximum.
  - The rules applied by code: length thresholds, the "too short" threshold and the anomaly caps.
- In the Pre-Sept. 2022 grids, "Respect de la consigne" is split into two criteria: "situation" (graded by the AI, 0 to 1) and "length" (applied by code from the word count, 0 to 1).
  - A `systemPrompt` field: the grader's instructions for this rubric, written from the criterion descriptions and grading explanations in RUBRICS.md. These descriptions are not part of the typed data.
- Instructions that are the same for every rubric (inferring the text type, the deduction format, handling `[illegible]` words, the overviews) are written once in the grader code.

### Analytics criteria

- The analytics criteria are a simpler, higher-level set of criteria that covers every rubric. They are used to compare exams graded with different rubrics (see "Class analytics" and "Student analytics") and to hold the mistake categories. They are defined once in `lib/rubrics/`, with an ID, a French name and an English subtitle each.
- They are the five criteria of the new grids: task (Réalisation de la tâche), coherence (Cohérence et cohésion), sociolinguistic (Adéquation sociolinguistique), vocabulary (Lexique) and grammar (Morphosyntaxe).
- Every rubric criterion names its analytics criterion, checked by the type system. The new grids map each criterion to the one with the same name. The Pre-Sept. 2022 grids map:
  - situation, length, facts, opinion (B1) and argument (B2) to task.
  - coherence to coherence.
  - sociolinguistic (B2 only) to sociolinguistic. The Pre-Sept. 2022 B1 grid has no criterion for it, so it is left out for those exams.
  - vocabularyRange, vocabularyControl and spelling to vocabulary.
  - sentences, tensesAndMoods and morphosyntax (B1), and grammar and sentences (B2), to grammar.
- The score of an analytics criterion in one exam is the sum of the scores of its rubric criteria, shown as a percentage of the sum of their maximums, because maximums differ between rubrics.

### Mistake categories

- Every deduction made by the grader has one or more mistake categories, usually only one. Automatic deductions have none.
- The grader must give at least one category per deduction. If it often gives several, the common instructions are tightened, and if that does not help, its output schema allows only one. The stored result keeps categories as an optional list of any length, so neither change needs a migration. Deductions saved without categories count as "Uncategorized" in analytics.
- Categories belong to the analytics criteria and are defined with them. A rubric criterion allows the categories of its analytics criterion. Each category has an ID, a French name and an English subtitle:
  - task: Respect de la consigne (Following the instructions), Type de texte (Text type conventions), Développement des idées (Developing ideas and arguments).
  - coherence: Organisation du texte (Structure and paragraphs), Connecteurs (Linking words), Reprises et références (Referring back to ideas), Ponctuation (Punctuation).
  - sociolinguistic: Registre (Register and tone), Tutoiement et vouvoiement (Choosing tu or vous), Formules d'usage (Greetings and closings).
  - vocabulary: Étendue du lexique (Range and repetition), Choix des mots (Word choice), Orthographe lexicale (Spelling).
  - grammar: Conjugaison (Verb forms), Temps et modes (Tenses and moods), Accords (Agreement), Déterminants et prépositions (Articles and prepositions), Construction des phrases (Sentence structure).
- Categories are shown on each deduction on the grading screen, in the exported feedback (French name), in session analytics, in class analytics and in student analytics.

### Transcriber

- The transcriber (Gemini 3.8 Flash) reads the redacted page images and returns plain text.
- It copies the student's spelling and grammar mistakes exactly as written, keeps paragraphs, leaves out crossed-out text and marks unreadable words as `[illegible]`.

### Word count

- The word count is computed by code from the transcription, using the counting rule in RUBRICS.md. The LLM never counts words.
- The word count is shown to the teacher and passed to the grader.

### Grader

- The grader (Claude Opus 5.5, with the effort set to high through `providerOptions: { anthropic: { effort: "high" } }`) receives the rubric's `systemPrompt` together with the common instructions, the exam question, the transcription, the word count and the feedback language. It grades each submission once.
- It infers the expected text type (email, formal letter, article, forum post, essay, contribution to a debate, etc.) from the question, since DELF questions almost always name it. There is no text type field. Guidance for each text type is part of the common instructions. If the inferred type is wrong, the teacher fixes the question text, which re-runs grading.
- For each criterion, the grader first compares the paper with the level descriptions and picks the level (allowed score) the paper reaches, then lists the deductions that explain the gap between that score and the maximum. This comparison and the evidence it quotes are not stored.
- Borderline cases follow tie-break rules written in RUBRICS.md and in the `systemPrompt`s, for example "Give B1+ only when the paper meets every point of the B1+ description. When torn between two levels, choose the lower one." These rules are based on the official DELF correction guides, which are searched for and cited in RUBRICS.md.
- It returns structured JSON, not free-form text, so the frontend fully controls how the result is displayed. The response contains:
  - The inferred text type.
  - The detected anomalies (for example hors-sujet thématique, hors-sujet discursif, hors-sujet complet, or off-topic for the Pre-Sept. 2022 grids).
  - An overview of the whole paper: its main strengths and weaknesses.
  - For each criterion: the chosen score, an overview and the deductions. A deduction is a number of points removed, a reason written by the LLM and, with mistake categories, its categories.
- Overviews are free-form feedback that never changes a score. A criterion overview gives what the student did well, with quoted examples, and mentions every mistake under that criterion that did not cost points, including when the criterion has its full points.
- Reasons and overviews are written in the feedback language and quote the student's text in French. The comparisons are written in English whatever the feedback language.
- New fields of the stored grading result are optional, so results saved before them stay valid without a migration, and the screens leave out what is missing.

### Computing the result

- Code adds automatic deductions with a fixed reason in the feedback language, so everything that removes points has the same form:
  - Length rules (the Pre-Sept. 2022 grids' "length" criterion, and "too short" in the new grids, which sets every criterion to 0).
  - Blank paper (every criterion set to 0).
  - Anomaly caps in the new grids (for example "Hors-sujet discursif: capped at 1 point").
- A criterion's score is its maximum minus its deductions. The response is rejected and the grader is asked again, up to 3 attempts in total, when a chosen score is not allowed by the rubric (for example 3.5 in a new grid) or when the deductions do not add up exactly to the gap between the maximum and the chosen score. After that, the grading step fails and shows "Retry".
- The total score is the sum of all criteria, out of 25.
- In the Pre-Sept. 2022 grids, off-topic answers are only flagged with a warning banner, as the rubric asks for a review rather than a fixed penalty.

### Measuring grading variance

- The effect of grader changes on the spread of scores is measured by grading the example paper in `examples/` 5 times before and 5 times after the change, with a script that is not committed.
- The scores of every run and their spread, per criterion and in total, are written in `evidence/grader-variance.md`.

## Session analytics

- The "Analytics" tab of a session shows aggregates of all graded submissions in the session. It never lists submissions or students one by one.
- Submissions still graded with an earlier rubric of the session (while they are being re-graded) are left out.
- For each criterion of the session's rubric, it shows:
  - How many submissions lost points on it, and the total and average points lost.
  - A bar chart of how many submissions reached each allowed score, labeled with its level. Bars go from red (lowest score) through yellow to green (highest score), using a fixed color mapping defined next to the score colors.
  - With mistake categories: for each category, how many submissions have a deduction in it and the points those deductions removed, sorted by number of submissions. Automatic deductions are not counted.
- It also shows how many times each anomaly was found.
- Charts use shadcn/ui Chart.
- Individual submissions have no session analytics.

## Class analytics

- The "Analytics" section of the class page shows aggregates of the class's recent graded submissions. It looks like session analytics and reuses its components and code. It never lists submissions or students one by one.
- It covers the N newest sessions (by exam date) with at least one graded submission. N is 5 by default and can be changed in the section, and the choice is remembered per class in local storage.
- It also covers the individual submissions whose exam date is after the exam date of the oldest of these sessions. Individual submissions from that same day are left out, because they may be older. When no session is covered, no individual submission is covered either.
- Submissions still graded with an earlier rubric of their session are left out.
- The exams can use different rubrics, so the criteria shown are the analytics criteria. For each one, it shows how many submissions lost points on it and the average percentage of points lost (see "Analytics criteria"). Exams whose rubric has no criterion for it are left out of it. There is no bar chart of scores, because the allowed scores differ between rubrics.
- With mistake categories, it shows the same category list as session analytics.
- It also shows how many times each anomaly was found, under its name in its rubric.

## Student analytics

- The class page has a "Students" section with a card for each student ID found in the class's graded submissions (session and individual). The card shows the student name (or "Student #a3f9" with "Identify"), the number of graded submissions and the score of the newest one.
- Clicking a student card, or a student name on a submission card or page, opens the student page (Classes > class > student). Student IDs differ between classes, so a student page covers one class.
- The student page shows simple, easy to understand statistics. There are no LLM-written summaries.
  - The total score over time, by exam date, with the session median next to it for exams taken in a session.
  - For each analytics criterion: the average percentage of points kept and how it changes over time.
  - The most frequent mistake categories over all exams: in how many exams each appears and the points removed.
  - A grid of the student's submission cards, each with its exam date, rubric name and score.
- Exams graded with different rubrics are combined through the analytics criteria.
- Student IDs that this browser maps to the same name in the class are shown as one student, so a student identified manually after a key change (see "Student identity") keeps one history.
- Submissions without a student ID or without a grading are left out.

## Student identity

- Student names never reach the backend. Each student is identified by an anonymous ID.
- The ID is an HMAC hash of the class ID and the normalized student name, using a secret key that only exists in the teacher's browsers. Names are normalized by ignoring case, accents and extra spaces, so "Alex" and "alex " give the same ID. The same name in two different classes gives two different IDs.
- The secret key is created in the browser the first time a student name is entered, including in a browser where the account already used another key. Nothing blocks entering names.
- The map from ID to name is kept in local storage. When typing a student name, the field suggests names already entered for that class.
- The user menu has "Export student names", which downloads `delf-grader-student-names-31-12-1999.zip` (with today's date) holding the secret key and the whole ID to name map, and "Import student names", which reads such a file, replaces this browser's key with the imported one and adds the imported names to this browser's map. Names already in the map are kept. The file never reaches the backend.
- When a submission's student ID is not in the local map, the student is shown as "Student #a3f9" (the start of the ID) with an "Identify" button. The teacher types the name and the app checks whether it gives the same ID with this browser's key:
  - If it does, the name is saved to the local map.
  - If it does not, the paper was either named with another key or the name has a typo. A dialog explains this and asks the teacher to confirm before the name is saved to the local map for that ID anyway.
  - Either way, every submission with that ID in the class then shows the name.
- The "?" button in the header opens an "Import Student Names" dialog with two options, each showing a short bullet list of steps:
  - "I still have the old browser": export the student names from the old browser's user menu, move the file to this computer, and import it from this browser's user menu.
  - "I no longer have the old browser": a new key is created as soon as a student name is entered. Past submissions show as "Student #a3f9". Open one, type the student's name and click "Identify", which restores the name on every submission with the same ID.
- The dialog also opens by itself, once per browser, when the browser has no key but the account already has one.
- Everything kept in the browser (the secret key, the ID to name map, card sorting and filters, the IndexedDB unredacted images, the layout and magnifier choices and the feedback language) is stored under the signed-in user's Clerk ID, so several teachers can share a browser. Browser data saved before this change, without a user ID, is moved under the ID of the first user who signs in, then deleted from its old place. Nothing is cleared when signing out.

## Post-Milestone 3

These are documented for later and must not be implemented yet.

- Bulk upload: several documents uploaded at once, with one document (an image or a PDF) per submission, redacted one by one in a queue, with unredacted images kept in the browser until they are redacted.
- Splitting bulk PDFs that contain several exams into separate submissions.
- Custom grading rubrics.
- The teacher's own grading of an exam, saved alongside the AI grading.

# Implementation Order

The work is tracked as GitHub issues, done in this order. Each issue only depends on the issues before it.

- #3: Removes the scaffolding and builds the app shell (theme, header, sign-in redirect, date and number helpers, confirmation dialog).
- #4: Defines the four rubrics in `lib/rubrics/` as type-safe data with their `systemPrompt`, plus the word counting function.
- #5: Adds classes, sessions and individual submissions, with their Convex schema, pages, forms, renaming and deleting.
- #6: Builds the submission page with its list of steps, the upload step, saving the images to Convex and the image viewer.
- #7: Transcribes the saved images with Gemini in the background and lets the teacher correct the text.
- #8: Grades the transcription with Claude against the rubric and computes the final score from the deductions.
- #9: Shows the grading result next to the submission image, with a "Re-grade" button.
- #10: Re-runs later steps when an earlier step or a session's rubric or question changes, and adds "Retry" for failed steps.
- #11: Adds the drawing tool for hiding personal information before the images are sent to Convex.
- #12: Adds student names, stored only in the browser, and the anonymous student IDs sent to Convex.
- #13: Adds the statistics, cover images and status badges on cards, plus sorting and filtering.
- #14: Adds the auto-saved notes at the bottom of the grading screen.
- #15: Fills the session "Analytics" tab with aggregates per criterion and anomaly counts.
- #26: Lets the teacher add more files after the first pick, mix images and PDFs, and reorder or remove pages.
- #27: Adds the shared standard zoom and magnifier to every view of a student's pages.
- #24: Lowers the spread of the grader's scores with tie-break rules, picking a level before deductions and high effort, measured in `evidence/`.
- #28: Adds the paper and criterion overviews with positive feedback and mistakes that did not cost points.
- #29: Exports the feedback for students, copied as plain text or downloaded as a PDF.
- #25: Stores everything kept in the browser under the signed-in user's ID.
- #30: Adds exporting and importing student names as a file, and the "Import Student Names" help dialog.
- #21: Adds the analytics criteria and mistake categories on deductions, shown on the grading screen, in the export and in session analytics. The copied text and the PDF from #29 must keep working.
- #19: Shows analytics for one student across several exams, based on the anonymous student ID.
- #35: Adds the "Analytics" section of the class page, covering its newest sessions and recent individual submissions through the analytics criteria.
- #22: Lets the teacher resize the side-by-side screens and switch between a horizontal and a vertical layout.
- #16: Reviews every page for legibility and checks that nothing breaks on small screens.
- #23: Adds the branding (logo, icon, tab titles, social card) and the search engine files.
- #2: Updates the README after checking what the Milestone 3 package requires.
- #17: (Post-Milestone 3) Uploads several documents at once as separate submissions, including splitting bulk PDFs that contain several exams.
- #18: (Post-Milestone 3) Lets teachers create their own grading rubrics in addition to the four fixed ones.
- #20: (Post-Milestone 3) Lets the teacher save their own grading of an exam alongside the AI grading.

## Maintenance and extension points

- Adding or changing a rubric only touches its file in `lib/rubrics/` (plus one line in `lib/rubrics/index.ts` for a new rubric). Every criterion of a new rubric must name its analytics criterion. Fix whatever then fails to type-check, and never copy rubric details into other parts of the code.
- Grading behavior is tuned in two places: the rubric's `systemPrompt` for rules specific to that rubric, and the common instructions in the grader code for everything else.
- Score color thresholds, the trend threshold and the colors of the analytics bars live in one place in `lib` and can be changed there.
- Anything about students (names, the secret key, the ID to name map) stays in the browser. New features must only send the anonymous student ID to Convex. Everything new kept in the browser is stored under the signed-in user's ID.
- New features that change a step's input must follow the same re-run rule as the existing steps: an explicit "Save", a dialog stating which steps will be re-run, and a re-run of every later step.
- Results of experiments (for example measuring the grader's variance) are written in the `evidence` folder at the root of the project. The scripts used to run them are not committed.
