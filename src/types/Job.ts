export type JobType<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> = {
  updateData: (newData: JobData) => void
  updateStatus: (newStatus: JobStatus) => void
  asJSON: () => string
  getId: () => string
  getStatus: () => JobStatus
  getOptions: () => JobOptions
  getDuration: () => JobDuration
  getData: () => JobData
  getBatch: () => string | null
};

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// start is set when job starts processing; end and duration are set when job is completed/failed
export type JobDuration = {
  start?: number
  end?: number
  duration?: number
};

export interface JobOptionsBase {
  completionCallback?: JobCallbackFunction
}

export interface JobDataBase {
  error?: {
    error?: string
    errorType?: string
    status: number
  }
}

// need to use any to appease TypeScript :-/
export interface JobCallbackFunction<JobOptions extends JobOptionsBase = any, JobData extends JobDataBase = any> {
  (completedJob: JobType<JobOptions, JobData>): Promise<void>
}
