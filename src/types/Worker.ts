import type { JobDataBase, JobOptionsBase, JobStatus, JobType } from './Job';

/**
 * Structure of the message sent to the worker thread from the Queue when starting to process a Job.
 */
export type WorkerMessage = {
  jobJson: string
  processJobExportPath: string
};

/**
 * Structure of the message sent from the worker thread back to the Queue when Job processing finished.
 */
export type WorkerResponse = {
  jobJson: string
  status: JobStatus
};

/**
 * Custom function executed by worker threads when processing Jobs. This function should return an object
 * containing JobData (processing results). This function should be exported as processJob() from the file
 * specified in the QueueOptions.processJobExportPath.
 * 
 * @param {JobOptions} jobOptions - The Job options (processing inputs).
 * @param {JobType} job - The Job being processed.
 * @returns {JobData} the Job data (processing results)
 */
export interface ProcessJobFunction<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> {
  (jobOptions: JobOptions, job: JobType<JobOptions, JobData>): Promise<JobData>
}
