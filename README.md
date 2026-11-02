# DELF Grader

DELF Grader is a website that helps French teachers grade handwritten DELF Production écrite practice exams. A teacher uploads photos or a PDF of a student's answer, hides any personal information, checks an AI transcription of the handwriting, and receives an AI grading report against an official DELF rubric: a score out of 25, a score for each criterion, and the reason for every point removed.

AI is used in two places: Gemini 3.8 Flash transcribes the handwriting and Claude Opus 5.5 grades the transcription. Calls to the Google and Anthropic APIs are made through the [AI SDK](https://ai-sdk.dev/) on the Convex backend. Ordinary code handles the word count, length rules, score caps and totals. The four supported rubrics are DELF B1 and B2, each in the current format and the format used before September 2022.

The grades are a baseline for the teacher, who keeps the final decision. A measured comparison with an examiner's scores is planned for the final milestone (see "Current limitations").

See the live prototype at https://delf-grader.vercel.app/.

## How to run or use it

### Option 1: use the live site (recommended)

You only need a laptop browser and an email address.

1. Open https://delf-grader.vercel.app/. You are redirected to the sign-in page.
2. Create your own account at https://delf-grader.vercel.app/sign-up. Each account sees only its own data.

### Option 2: run it locally

The live site is the quickest way to try the app. Running it locally uses your own accounts with four providers:

| Provider                                               | What it does                                      | What you need                                              |
| ------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------- |
| [Convex](https://www.convex.dev/)                      | Backend, database, file storage, and the AI calls | Only an account. The CLI creates the project               |
| [Clerk](https://clerk.com/)                            | Sign-in and accounts                              | An application, its two API keys, and its Frontend API URL |
| [Anthropic](https://platform.claude.com/)              | Grading with `claude-opus-5-5`                    | An API key on an account with credits                      |
| [Google AI Studio](https://aistudio.google.com/apikey) | Transcription with `gemini-3.8-flash`             | An API key                                                 |

#### 1. Install the project

You need Node.js (LTS). The repository pins its pnpm version, and `corepack enable` will use it.

```bash
git clone https://github.com/SerbanUntu/delf-grader.git
cd delf-grader
corepack enable
pnpm install
```

#### 2. Create the Convex deployment

```bash
pnpm exec convex dev --once
```

Log in when prompted and create a new project. This creates a development deployment and writes `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` to `.env.local`.

The app declares three required Convex variables that you set in step 4, so this first run may stop with an error about them. Continue as long as `.env.local` now contains those three values.

#### 3. Create the Clerk application

1. In the [Clerk Dashboard](https://dashboard.clerk.com/), create an application and enable sign-in with **Email** and **Password**. New applications start on a development instance, which is what you want here.
2. Open the [Convex integration page](https://dashboard.clerk.com/apps/setup/convex) and select **Activate Convex integration**. Copy the **Frontend API URL** it shows, which looks like `https://verb-noun-00.clerk.accounts.dev`. You need it in step 4.
3. Open the **API keys** page and add the two keys to `.env.local`:

   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

#### 4. Set the Convex variables

The AI calls and the sign-in check run on Convex, so these three values are set on the deployment, not in `.env.local`. Leaving out the value makes the CLI prompt for it, which keeps your keys out of your shell history.

```bash
pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN
pnpm exec convex env set ANTHROPIC_API_KEY
pnpm exec convex env set GOOGLE_GENERATIVE_AI_API_KEY
```

| Variable                       | Value                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN`      | The Clerk Frontend API URL from step 3. Clerk's own guide calls this `CLERK_FRONTEND_API_URL`, but this project uses the name shown here. |
| `ANTHROPIC_API_KEY`            | A key from the [Claude Console](https://platform.claude.com/settings/keys)                                                                |
| `GOOGLE_GENERATIVE_AI_API_KEY` | A key from [Google AI Studio](https://aistudio.google.com/apikey)                                                                         |

You can also set these in the [Convex dashboard](https://dashboard.convex.dev/), under your development deployment's settings.

#### 5. Start the app

```bash
pnpm dev
```

This runs the Convex sync and the Next.js server together. Open http://localhost:3000/, create an account on your own Clerk application, and follow "What to try" below.

#### If something goes wrong

- **The app fails at startup with an environment error:** check that `.env.local` has all five values from steps 2 and 3. The Clerk keys must start with `pk_` and `sk_`.
- **You can sign in, but pages stay empty or report that you are not signed in:** check that the Convex integration is activated and that `CLERK_JWT_ISSUER_DOMAIN` exactly matches your Frontend API URL. Then restart `pnpm dev`.
- **Transcription or grading shows as failed:** the step's screen shows the error. Check the matching API key and your provider credits and model access, then click **Retry**.

`.env.local.example` also lists these variables, including the two AI keys and `E2E_CLERK_USER_EMAIL`. You don't need to put the AI keys in `.env.local`, because the code reads them from Convex.

#### Running the tests

- **Unit tests:** run `pnpm test:unit`. They cover the date, number and naming helpers.
- **End-to-end tests:** run `pnpm exec playwright install chromium`, set `E2E_CLERK_USER_EMAIL` in `.env.local` to the email of a test user in your Clerk application, keep `pnpm dev` running, then run `pnpm test:e2e`. They cover sign-in, sessions and redaction.

## What to try

Both walkthroughs use the files in `examples/`: a B2 forum question and a one-page handwritten answer of about 284 words, signed by a fictional student. To try your own paper, please use made-up text instead of real student work, because saved pages are sent to external AI providers.

### Walkthrough 1: grade the example paper

1. On the home page, click **New class** and give it any name.
2. Under **Individual submissions**, click **New submission**. Choose the rubric **New B2**, paste the contents of `examples/example_question.txt` as the exam question, leave the student name empty, and create the submission.
3. **Upload:** pick `examples/handwritten_answer.jpeg` and click **Save**.
4. **Redaction:** draw a black rectangle over the signature "Amélie" at the bottom of the page, then click **Save**. If you skip this, the button reads **Save (no redactions)** instead.
5. **Transcription** starts by itself. Expect the full text in an editable box, without the signature you covered. To check that the transcriber is not correcting the student:
   - The student's mistakes should be kept, such as "tu la supprime" and "l'avoir enregistré".
   - The words "sur internet", added above the line near the end, should appear after "amis".
6. **Grading** starts by itself once transcription is done. Expect:
   - a total score out of 25
   - the word count, about 284, and the text type the grader inferred from the question, a forum message
   - five criteria, each with a French name, an English subtitle and a score of 0, 1, 3 or 5
   - a list of deductions with reasons in English that quote the French text

You can leave the page while steps run, because they run on the server.

### Walkthrough 2: see what re-runs and what varies

1. On the **Grading** step, click **Re-grade** and confirm. The new result replaces the old one, and the total may differ, because the grader's score can vary between runs.
2. Open the **Transcription** step, change the text, and click **Save**. A dialog named **Save the transcription?** lists the steps that will re-run. Click **Yes**, and grading runs again.
3. To see a rule enforced by code rather than by AI, cut the text to 124 words or fewer and save again. The New B2 rubric then sets every criterion to 0 and the screen shows a warning explaining why.

## Current limitations

The workflow planned for Milestone 2 works end to end: upload, transcription and grading of a single exam. The prototype also goes beyond that plan with the B1 rubrics, the pre-September 2022 grids, in-browser redaction, and classes and sessions.

**Accuracy still to be measured**

- The stakeholder, an accredited DELF examiner, found the grades generally close to her own on the exams she tried. This is an informal impression, so a measured comparison with an examiner's scores is planned for the final milestone.
- Transcription accuracy has not been measured yet either. The teacher can check and correct every transcription before relying on the grade.
- The score can vary between runs. Reducing this is an open task ([#24](https://github.com/SerbanUntu/delf-grader/issues/24)).

**Planned for the final milestone**

- Class-level analytics of common mistakes; the session **Analytics** tab is a placeholder until then ([#15](https://github.com/SerbanUntu/delf-grader/issues/15))
- Teacher notes and comments on a submission ([#14](https://github.com/SerbanUntu/delf-grader/issues/14))
- Zooming in on the paper on the transcription and grading screens; zoom is currently in the redaction tool ([#27](https://github.com/SerbanUntu/delf-grader/issues/27))
- Specific examples of what the student did well, alongside the deductions ([#28](https://github.com/SerbanUntu/delf-grader/issues/28))
- Exporting the feedback ([#29](https://github.com/SerbanUntu/delf-grader/issues/29))
- Score statistics on cards, plus sorting and filtering ([#13](https://github.com/SerbanUntu/delf-grader/issues/13))
- Adding files after the first upload; today, all pages of a submission are selected at the same time ([#26](https://github.com/SerbanUntu/delf-grader/issues/26))

**Could-haves, if time allows**

- Legibility and small-screen review; the site is designed for laptops ([#16](https://github.com/SerbanUntu/delf-grader/issues/16))
- Bulk upload ([#17](https://github.com/SerbanUntu/delf-grader/issues/17))
- Custom rubrics beyond the four fixed ones ([#18](https://github.com/SerbanUntu/delf-grader/issues/18))
- Analytics for one student across several exams ([#19](https://github.com/SerbanUntu/delf-grader/issues/19))
- Separate student name lists for people sharing one browser ([#25](https://github.com/SerbanUntu/delf-grader/issues/25))

**Design choices that will stay**

- **Redaction is manual and optional.** It runs in the teacher's browser, so unredacted pages are never uploaded. The teacher decides what to hide, and the saved pages are then sent to the AI transcriber.
- **Student names stay in the browser.** The backend only receives an anonymous ID. To use another browser, the teacher copies a secret student key from the user menu.
- **Sign-in runs on a Clerk development instance.** This keeps costs down by avoiding a dedicated domain.

**Simulated or hard-coded**

Nothing in the workflow is simulated: transcription and grading are live AI calls. The rubrics are fixed data in `lib/rubrics/`.

## More documentation

- [Requirements](https://github.com/SerbanUntu/delf-grader/blob/main/docs/REQUIREMENTS.md)
- [Implementation plan](https://github.com/SerbanUntu/delf-grader/blob/main/docs/IMPLEMENTATION_PLAN.md): describes the full intended product, so use the list above for current status
- [Rubrics](https://github.com/SerbanUntu/delf-grader/blob/main/docs/RUBRICS.md)
- [Tech stack](https://github.com/SerbanUntu/delf-grader/blob/main/docs/TECH_STACK.md)
