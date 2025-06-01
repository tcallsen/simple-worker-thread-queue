import type { JobDataBase, JobOptionsBase, JobStatus, JobType } from './Job';

export type WorkerMessage = {
  jobJson: string
  processJobExportPath: string
};

export type WorkerResponse = {
  jobJson: string
  status: JobStatus
};

export type ProcessJobFunction<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = (jobOptions: JobOptions, job: JobType<JobOptions, JobData>) => Promise<JobData>;
