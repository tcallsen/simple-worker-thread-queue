import { ProcessJobFunction, JobType } from "../../src";
import { type JobTestOptions, type JobTestData, TestWorkerJobDataResponse } from "../types";

// NOTE: this file is compiled and read from dist/test/worker/TestWorker.js during tests
//  since Jest tests do not like to load .ts files from inside worker threads

export const processJob: ProcessJobFunction<JobTestOptions, JobTestData> = async function (jobOptions: JobTestOptions, job: JobType<JobTestOptions, JobTestData>): Promise<JobTestData> {
  // complete job after 250ms
  await new Promise(r => setTimeout(r, 250));

  // return updated job data
  return TestWorkerJobDataResponse as JobTestData;
};
