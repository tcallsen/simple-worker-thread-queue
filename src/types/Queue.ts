import type { BatchType } from './Batch';
import type { JobDataBase, JobOptionsBase, JobType } from './Job';

export type QueueType<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = {
  add: (options: JobOptions) => JobType<JobOptions, JobData>
  addToBatch: (options: JobOptions, batch: BatchType<JobOptions, JobData>) => JobType<JobOptions, JobData>
  startProcessing: () => Promise<void>
  getQueuedJobs: () => JobType<JobOptions, JobData>[]
  getProcessingJobs: () => JobType<JobOptions, JobData>[]
  getFinishedJobs: () => JobType<JobOptions, JobData>[]
};

export type QueueOptions = {
  processJobExportPath: string
};
