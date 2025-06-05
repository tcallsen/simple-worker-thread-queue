import type { JobType, JobStatus, JobDuration, JobDataBase, JobOptionsBase } from './Job';

/**
 * A Batch represents a collection of Jobs, and tracks the processing status/duration
 * of the collection. An optional completion callback function can be supplied with the
 * constructor which will be executed when Batch processing completes.
 */
export type BatchType<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = {

  /**
   * Adds a Job to the Batch. This is for tracking purposes only. Use QueueType.addToBatch()
   * to add a Job to a Batch and Queue for processing.
   *
   * @param {JobType} job - The Job to add to the Batch.
   */
  addJob: (job: JobType<JobOptions, JobData>) => void

  /**
   * Updates the status of a tracked Job. The Batch status depends on the status of its underlying
   * Jobs (e.g. if all jobs have completed, the Batch status will be marked as completed).
   *
   * @param {JobType} notifyingJob - The Job to update in the Batch.
   */
  update: (notifyingJob: JobType<JobOptions, JobData>) => void
  
  /**
   * Returns the id of the Batch.
   *
   * @returns {string} The id of the Batch.
   */
  getId: () => string

  /**
   * Returns the processing status of the Batch.
   *
   * @returns {JobStatus} The processing status of the Batch.
   */
  getStatus: () => JobStatus
  
  /**
   * Returns the processing duration of the Batch (i.e. start, end, and duration if Batch
   * has completed processing).
   *
   * @returns {JobDuration} The duration of the Batch.
   */
  getDuration: () => JobDuration

  /**
   * Returns the jobs tracks by the Batch.
   *
   * @returns {JobType<JobOptions, JobData>[]} The Jobs tracked by the Batch.
   */
  getJobs: () => JobType<JobOptions, JobData>[]
};

/**
 * A Batch completion callback function will be executed when the Batch finishes processing.
 * 
 * @param {BatchType} completedBatch - The completed Batch, containing a list of Jobs.
 */
export interface BatchCompletionCallback<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> {
  (completedBatch: BatchType<JobOptions, JobData>): Promise<void>
};
