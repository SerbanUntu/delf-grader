DELF Grader is a Next.js 16 + Convex application that allows French teachers to upload DELF production écrite exam questions and handwritten (redacted) student answers. The handwritten answers are fed to a transcriber agent, which then sends the text output to a grader agent, which comes back with a justified grading based on a selected fixed rubric. It uses Clerk and Vercel. There will be fewer than 5 users of the application.

For each user (teacher), there is a list of classes, where each class has a list of sessions (an instance of the whole class taking a practice exam, consisting of multiple student submissions).

Refer to @docs/REQUIREMENTS.md for the requirements of the project, @docs/STYLE_GUIDE.md for how to contribute (must read before making changes), and @docs/TECH_STACK.md for more details regarding the technologies used.
