import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "process due board resets",
  { minutes: 15 },
  internal.resets.processDueResets,
  {},
);

export default crons;
