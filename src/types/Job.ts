/**
 * A Job to be processed by a Queue. An optional completion callback function can be supplied with the
 * constructor which will be executed when Job processing completes.
 */
export type JobType<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = {
  
  /**
   * Updates the Job data (processing results).
   *
   * @param {JobData} newData - The new data to update the Job with.
   */
  updateData: (newData: JobData) => void

  /**
   * Updates the Job status.
   *
   * @param {JobStatus} newStatus - The new status to update the Job with.
   */
  updateStatus: (newStatus: JobStatus) => void

  /**
   * Serialzes the Job to JSON. Used by the Queue to pass Jobs to worker threads.
   *
   * @returns {string} The Job as a JSON string.
   */
  asJSON: () => string

  /**
   * Returns the id of the Job.
   *
   * @returns {string} The Job id.
   */
  getId: () => string

  /**
   * Returns the status of the Job.
   *
   * @returns {JobStatus} The status id.
   */
  getStatus: () => JobStatus

  /**
   * Returns the Job options (processing inputs).
   *
   * @returns {JobOptions} The job options.
   */
  getOptions: () => JobOptions

  /**
   * Returns the Job duration (i.e. start, end, and duration if Job has finished processing).
   *
   * @returns {JobDuration} The job duration.
   */
  getDuration: () => JobDuration

  /**
   * Returns the Job data (processing results).
   *
   * @returns {JobData} The job data.
   */
  getData: () => JobData

  /**
   * Returns the Batch id this Job is associated with. Will return null if the Job is not part
   * of a Batch.
   *
   * @returns {string | null} The Batch id if this Job is part of a Batch, null otherwise.
   */
  getBatch: () => string | null
};

/**
 * A Job's processing status.
 */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * An object describing the processing duration. All times are set using Date.now() as milliseconds
 * elapsed since the epoch Start is set then the Job begins processing, while the end and duration
 * are set when the Job completes processing.
 */
export type JobDuration = {
  start?: number
  end?: number
  duration?: number
};

/**
 * The base interface that JobOptions (i.e. processing inputs) should inherit from. This includes
 * an optional completion callback function that will be executed when the Job finishes processing.
 */
export interface JobOptionsBase {
  completionCallback?: JobCompletionCallback
}

/**
 * The base interface that JobData (i.e. processing results) should inherit from.
 */
export interface JobDataBase {
  error?: {
    error?: string
    errorType?: string
    status: number
  }
}

/**
 * A Job completion callback function executed when the Job finishes processing.
 * 
 * @param {JobType} completedJob - The completed Job, containing processing results in the JobData.
 */
export interface JobCompletionCallback<JobOptions extends JobOptionsBase = any, JobData extends JobDataBase = any> {
  (completedJob: JobType<JobOptions, JobData>): Promise<void>
}
