# Implementation Plan

Everything in this plan is in scope for the current milestone, except items marked "Milestone 3+", which are collected in the last section and must not be implemented yet.

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
- The website is designed for laptops. It does not need to look polished on phones or tablets, but nothing may be broken there: everything must still be visible and usable. Do not design mobile-first.
- All UI text is in English, except DELF terms such as "DELF", "Production écrite" and the rubric criterion names. Users know French, but the developers and testers of the app do not, so French criterion names have a short English subtitle.
- Dates are shown as `31/12/1999`. Decimal numbers use a decimal point (`17.5`).
- Every page has a header with Clerk's user button and breadcrumbs (Classes > class > session > submission).
- Every destructive action (deleting, or saving a change that re-runs later steps) asks for confirmation in a dialog.

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
- Class page: two separate sections, "Sessions" and "Individual submissions", each with a grid of cards and a button to create a new item.
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
  - Submission: its score. Submission cards also show the student name (read from the browser, or "Student #a3f9" when it is not known in the current browser) and the exam date.
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

1. Upload: the teacher picks one or more images, or one PDF, holding the student's answer. The files stay in the browser and are not sent to Convex.
   - A submission can have several pages, kept in order. PDF pages are turned into images in the browser.
   - Limits: 10 pages and 20 MB per submission.
   - Unredacted images are kept in the browser's IndexedDB, so they survive a page reload. They are deleted once the redacted version is saved or the submission is deleted. On any other browser, the submission shows a message saying the images are only available on the browser where they were uploaded.
2. Redaction: an in-browser tool to hide personal information.
   - The teacher draws black rectangles on each page, and can undo, delete rectangles and zoom.
   - Saving burns the rectangles into the pixels and re-encodes each page as a JPEG, so the hidden data is gone for good and metadata such as GPS location is removed.
   - Only after this step is saved are the images sent to Convex.
   - Redaction is optional and is only a precaution. Most of the time the answer contains only handwritten text without personal information, and the teacher simply confirms and saves without drawing anything. When nothing has been drawn, the save dialog states that the images will be sent as they are.
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

- Below the list of steps there is a "Notes" button that opens the notes screen.
- The transcription, grading and notes screens show the submission image on one side and the step's content on the other side (the transcription text area, the grading result or the notes).
- The image side shows the redacted images from Convex. If they are not saved yet, it falls back to the local uploaded images, and then to a blank area saying that the submission will appear there once it is uploaded. Multi-page submissions can be scrolled or paged through.
- Notes are plain text, saved automatically as the teacher types, and kept for future reference. Notes exist on submissions only.
- The grading screen shows:
  - The total score out of 25 with the colored progress circle.
  - The word count and the text type the grader inferred from the question (for example "Expected text type: lettre formelle").
  - A warning banner for every detected anomaly (for example an off-topic answer or an answer that is too short).
  - For each criterion: its French name with an English subtitle, the score out of its maximum, the level label for that score, and the list of deductions (points removed and the reason).
  - The "Re-grade" button.

## Rubrics and grading

### Supported rubrics

- The four fixed rubrics are DELF B1 and B2 Production écrite, in the grids used until 31/08/2022 and the grids used since 01/09/2022. They are described in [RUBRICS.md](RUBRICS.md) and are named in the app:
  - "(Pre-Sept. 2022) B1"
  - "(Pre-Sept. 2022) B2"
  - "New B1"
  - "New B2"

### Rubric data

- The rubrics are the single source of truth for grading. Their structure is fully type-safe and drives the grader's output format, what the grading screen shows, and the analytics.
- Code used by both the Convex backend and the frontend lives in the existing `lib` folder. Each rubric is defined in its own file in `lib/rubrics/`, which holds both its structure and its system prompt. Changing a rubric only requires changing its file. Adding a rubric requires its file plus one line in the type-checked list of all rubrics in `lib/rubrics/index.ts`.
- Everything else (Convex validators, the grader's output schema, the grading screen, analytics) is derived from the rubric data, so any code that must be updated after a change fails to type-check.
- Each rubric holds:
  - An ID, a display name, the CEFR level, the grid (Pre-Sept. 2022 or new) and the minimum word count.
  - The list of criteria. Each criterion has an ID, a French name, a short English subtitle, its maximum points, the list of allowed scores and the level label for each allowed score. New grids allow only 0, 1, 3 and 5 (labeled with the bands from RUBRICS.md). Pre-Sept. 2022 grids allow every 0.5 step from 0 to the maximum.
  - The rules applied by code: length thresholds, the "too short" threshold and the anomaly caps.
- In the Pre-Sept. 2022 grids, "Respect de la consigne" is split into two criteria: "situation" (graded by the AI, 0 to 1) and "length" (applied by code from the word count, 0 to 1).
  - A `systemPrompt` field: the grader's instructions for this rubric, written from the criterion descriptions and grading explanations in RUBRICS.md. These descriptions are not part of the typed data.
- Instructions that are the same for every rubric (inferring the text type, the deduction format, handling `[illegible]` words) are written once in the grader code.

### Transcriber

- The transcriber (Gemini 3.8 Flash) reads the redacted page images and returns plain text.
- It copies the student's spelling and grammar mistakes exactly as written, keeps paragraphs, leaves out crossed-out text and marks unreadable words as `[illegible]`.

### Word count

- The word count is computed by code from the transcription, using the counting rule in RUBRICS.md. The LLM never counts words.
- The word count is shown to the teacher and passed to the grader.

### Grader

- The grader (Claude Opus 5.5) receives the rubric's `systemPrompt` together with the common instructions, the exam question, the transcription and the word count. It grades each submission once.
- It infers the expected text type (email, formal letter, article, forum post, essay, contribution to a debate, etc.) from the question, since DELF questions almost always name it. There is no text type field. Guidance for each text type is part of the common instructions. If the inferred type is wrong, the teacher fixes the question text, which re-runs grading.
- It returns structured JSON, not free-form text, so the frontend fully controls how the result is displayed. The response contains:
  - The inferred text type.
  - The detected anomalies (for example hors-sujet thématique, hors-sujet discursif, hors-sujet complet, or off-topic for the Pre-Sept. 2022 grids).
  - A list of deductions grouped by criterion. A deduction is a number of points removed and a reason written by the LLM.
- Justifications are written in English and quote the student's text in French.

### Computing the result

- Code adds automatic deductions with a fixed reason, so everything that removes points has the same form:
  - Length rules (the Pre-Sept. 2022 grids' "length" criterion, and "too short" in the new grids, which sets every criterion to 0).
  - Blank paper (every criterion set to 0).
  - Anomaly caps in the new grids (for example "Hors-sujet discursif: capped at 1 point").
- A criterion's score is its maximum minus its deductions. If the grader's deductions lead to a score that the rubric does not allow (for example 3.5 in a new grid), the response is rejected and the grader is asked again, up to 3 attempts in total. After that, the grading step fails and shows "Retry".
- The total score is the sum of all criteria, out of 25.
- In the Pre-Sept. 2022 grids, off-topic answers are only flagged with a warning banner, as the rubric asks for a review rather than a fixed penalty.

## Session analytics

- The "Analytics" tab of a session shows common mistakes at the criterion level, based on the deductions of all graded submissions in the session.
- For each criterion, it shows how many students lost points, the total and average points lost, how scores and levels are spread across students, and the list of deduction reasons, each linking to its submission.
- Individual submissions have no analytics.

## Student identity

- Student names never reach the backend. Each student is identified by an anonymous ID.
- The ID is an HMAC hash of the class ID and the normalized student name, using a secret key that only exists in the teacher's browsers. Names are normalized by ignoring case, accents and extra spaces, so "Alex" and "alex " give the same ID. The same name in two different classes gives two different IDs.
- The secret key is created in the browser the first time a student name is entered. The teacher can copy it from the user menu and paste it into another browser. In a browser without the key, the app asks the teacher to import it (or create a new one, with a warning that IDs will not match those from other browsers) before student names can be entered.
- The map from ID to name is kept in local storage. When typing a student name, the field suggests names already entered for that class.
- When a submission's student ID is not in the local map, the student is shown as "Student #a3f9" (the start of the ID) with an "Identify" button. The teacher types the name, the app checks that it gives the same ID, and saves it to the local map. A name that does not match is rejected, so a typo cannot attach the submission to the wrong student.

## Milestone 3+

These are documented for later and must not be implemented yet.

- Bulk upload: several documents uploaded at once, with one document (an image or a PDF) per submission, redacted one by one in a queue, with unredacted images kept in the browser until they are redacted.
- Splitting bulk PDFs that contain several exams into separate submissions.
- Custom grading rubrics.
- Analytics for one student across several exams, based on the anonymous student ID.
- The teacher's own grading of an exam, saved alongside the AI grading.
- More detailed mistake categories within each criterion, so deductions and analytics can be grouped more finely than by criterion.
- Flexible side-by-side screens: resizing either side, and switching between a horizontal and a vertical layout.

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
- #14: Adds the notes screen for each submission.
- #15: Fills the session "Analytics" tab with common mistakes per criterion.
- #16: Reviews every page for legibility and checks that nothing breaks on small screens.
- #17: (Milestone 3+) Uploads several documents at once as separate submissions, including splitting bulk PDFs that contain several exams.
- #18: (Milestone 3+) Lets teachers create their own grading rubrics in addition to the four fixed ones.
- #19: (Milestone 3+) Shows analytics for one student across several exams, based on the anonymous student ID.
- #20: (Milestone 3+) Lets the teacher save their own grading of an exam alongside the AI grading.
- #21: (Milestone 3+) Adds more detailed mistake categories within each criterion for deductions and analytics.
- #22: (Milestone 3+) Lets the teacher resize the side-by-side screens and switch between a horizontal and a vertical layout.

## Maintenance and extension points

- Adding or changing a rubric only touches its file in `lib/rubrics/` (plus one line in `lib/rubrics/index.ts` for a new rubric). Fix whatever then fails to type-check, and never copy rubric details into other parts of the code.
- Grading behavior is tuned in two places: the rubric's `systemPrompt` for rules specific to that rubric, and the common instructions in the grader code for everything else.
- Score color thresholds and the trend threshold live in one place in `lib` and can be changed there.
- Anything about students (names, the secret key, the ID to name map) stays in the browser. New features must only send the anonymous student ID to Convex.
- New features that change a step's input must follow the same re-run rule as the existing steps: an explicit "Save", a dialog stating which steps will be re-run, and a re-run of every later step.
