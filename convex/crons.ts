import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "delete unused page images",
  "0 3 * * *",
  internal.cleanup.deleteUnusedPages,
  {},
);

export default crons;
