import type { JobType, ProcessJobFunction } from "simple-worker-thread-queue";
import type { ExampleJobOptions, ExampleJobData } from "./types";

export const processJob: ProcessJobFunction<ExampleJobOptions, ExampleJobData> = async function (jobOptions: ExampleJobOptions, job: JobType<ExampleJobOptions, ExampleJobData>): Promise<ExampleJobData> {
  const result: ExampleJobData = {
    message: `Hello ${jobOptions.name}`,
  };
  // result will be saved to the job data
  return result;
}
