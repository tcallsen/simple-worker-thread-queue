import type { JobType, JobStatus, JobDuration, JobDataBase, JobOptionsBase } from './Job';

export type BatchType<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = {
  addJob: (job: JobType) => void
  update: (notifyingJob: JobType<JobOptions, JobData>) => void
  getId: () => string
  getStatus: () => JobStatus
  getDuration: () => JobDuration
  getJobs: () => JobType<JobOptions, JobData>[]
};

export interface BatchCallbackFunction<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> {
  (completedBatch: BatchType<JobOptions, JobData>): Promise<void>
};
