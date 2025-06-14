import type { JobDataBase, JobOptionsBase } from "simple-worker-thread-queue"

// make sure custom types extend base types

export interface ExampleJobOptions extends JobOptionsBase {
  name: string
};

export interface ExampleJobData extends JobDataBase {
  message: string
};
