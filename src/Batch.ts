import { v4 as uuidv4 } from 'uuid';

import type { BatchCallbackFunction, BatchType } from '../types/Batch.ts';
import type { JobStatus, JobDuration, JobDataBase, JobOptionsBase } from '../types/Job';
import type { JobType } from '../types/Job';

import { Job } from './Job.ts';

export class Batch<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> implements BatchType<JobOptions, JobData> {
  private readonly id: string;
  private status: JobStatus;
  private duration: JobDuration;
  private completionCallback?: BatchCallbackFunction<JobOptions, JobData>;

  // jobs are only current as of their last call to this.update() - references to jobs
  //  are broken during serialization/communicate with worker
  private jobs: {
    [jobId: string]: JobType
  };

  constructor(completionCallback?: BatchCallbackFunction<JobOptions, JobData>) {
    this.id = `batch-${Date.now()}-${uuidv4()}`;
    this.status = 'pending';
    this.duration = {};
    this.completionCallback = completionCallback;

    this.jobs = {};
  }

  addJob(job: JobType): void {
    this.jobs[job.getId()] = job;
  }

  update(notifyingJob: JobType): void {
    // update job in batch
    this.jobs[notifyingJob.getId()] = notifyingJob;

    // mark start time when recieving update form first job
    if (this.status === 'pending') {
      this.status = 'processing';
      this.duration.start = Date.now();
    }

    if (notifyingJob.getStatus() === 'completed' || notifyingJob.getStatus() === 'failed') {
      // check if this is last job to finish processing
      const allJobsFinished: boolean = Object.values(this.jobs).every((job: JobType) => job.getStatus() === 'completed' || job.getStatus() === 'failed');

      // mark end time when last job is completed or failed
      if (allJobsFinished && this.duration.start) {
        this.status = 'completed';
        this.duration.end = Date.now();
        this.duration.duration = this.duration.end - this.duration.start;

        // execute completion callback if provided
        if (this.completionCallback) {
          this.completionCallback(this);
        }
      }
    }

    console.log(`Batch '${this.id}' status updated to '${this.status}'`);
  }

  getId(): string {
    return this.id;
  }

  getStatus(): JobStatus {
    return this.status;
  }

  getDuration(): JobDuration {
    return this.duration;
  }

  getJobs(): JobType<JobOptions, JobData>[] {
    return Object.values(this.jobs) as Job<JobOptions, JobData>[];
  }
}
