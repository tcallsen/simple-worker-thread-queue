import type { BatchType } from './Batch';
import type { JobDataBase, JobOptionsBase, JobType } from './Job';

/**
 * Represents a Queue of Jobs to be processed. Manages the statuses of Jobs and Batches, and
 * coordinates the processing of Jobs in worker threads. The Queue only exists in memory, and
 * will periodically clear finished Job history and tracked Batches to free up memory.
 */
export type QueueType<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = {
  
  /**
   * Adds a Job to the Queue. The Job will begin processing immediately if a worker thead is available.
   *
   * @param {JobOptions} options - Options (processing inputs) describing a Job.
   * @returns {JobType} The created Job. Note: this Job object will not be updated with processing results
   *  due to the JSON serialization used to pass Jobs to worker threads. Use a Job completion callback
   *  to receive processing results.
   */
  add: (options: JobOptions) => JobType<JobOptions, JobData>
  
  /**
   * Adds a Job to the Queue, and tracks it as part of a Batch of Jobs. The Job will begin processing
   * immediately if a worker thead is available.
   *
   * @param {JobOptions} options - Options (processing inputs) describing a Job.
   * @param {BatchType} batch - Batch to add the Job to.
   * @returns {JobType} The created Job. Note: this Job object will not be updated with processing results
   *  due to the JSON serialization used to pass Jobs to worker threads. Use a Job completion callback,
   *  or a Batch completion callback to receive processing results.
   */
  addToBatch: (options: JobOptions, batch: BatchType<JobOptions, JobData>) => JobType<JobOptions, JobData>
  
  /**
   * Returns a list of queue Jobs.
   *
   * @returns {JobType[]} Queued Jobs.
   */
  getQueuedJobs: () => JobType<JobOptions, JobData>[]

  /**
   * Returns a list of processing Jobs.
   *
   * @returns {JobType[]} Processing Jobs.
   */
  getProcessingJobs: () => JobType<JobOptions, JobData>[]

  /**
   * Returns a list of finished Jobs. Note: this list will be periodically cleared to free up memory.
   *
   * @returns {JobType[]} Finished Jobs.
   */
  getFinishedJobs: () => JobType<JobOptions, JobData>[]
};

/**
 * Options for defining a Queue.
 */
export type QueueOptions = {
  
  /**
   * Absolute path to the file exporting the processJob() function. This function will be called by
   * the worker thread when processing a Job. This function should follow the ProcessJobFunction
   * function type interface.
   */
  processJobExportPath: string
};
