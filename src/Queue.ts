import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import path from 'node:path';
import cron from 'node-cron';

import type { JobCallbackFunction, JobDataBase, JobOptionsBase, JobType } from '../types/Job';
import type { QueueOptions, QueueType } from '../types/Queue';
import type { BatchType } from '../types/Batch';
import type { WorkerResponse } from '../types/Worker';

import { Job } from './Job';

// read CONCURRENT_WORKER_THREADS from .env file
import { config } from 'dotenv';
config();

// number of concurrent worker threads to use for processing jobs;
//  value of 1 will process jobs sequentially
const CONCURRENT_WORKER_THREADS: number = parseInt(process.env.CONCURRENT_WORKER_THREADS || '1') || 1;

export class Queue<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> extends EventEmitter implements QueueType<JobOptions, JobData> {
  private processJobExportPath: string;

  // current queue
  private queuedJobs: JobType<JobOptions, JobData>[];

  // jobs being processed
  private processingJobs: JobType<JobOptions, JobData>[];

  // finished/processed jobs
  private finishedJobs: JobType<JobOptions, JobData>[];

  // maintain references to job completion callbacks (if supplied);
  //  they otherwise would be lost during serialization with worker threads
  private jobCompletionCallbacks: {
    [jobId: string]: JobCallbackFunction<JobOptions, JobData>
  };

  // maintain references to batches
  private batches: {
    [batchId: string]: BatchType<JobOptions, JobData>
  };

  constructor(options: QueueOptions) {
    super();

    const { processJobExportPath } = options;
    this.processJobExportPath = processJobExportPath;
    if (!options || !this.processJobExportPath) throw new Error('Queue constructor requires options object of type QueueOptions');

    this.queuedJobs = [];
    this.processingJobs = [];
    this.finishedJobs = [];
    this.jobCompletionCallbacks = {};
    this.batches = {};

    // periodically clear completed jobs and batches to free up memory
    cron.schedule('0 0 * * *', () => {
      if (this.queuedJobs.length === 0 && this.processingJobs.length === 0) {
        console.log(`[scheduled cleanup] [${new Date()}] clearing ${this.finishedJobs.length} jobs, ${Object.keys(this.jobCompletionCallbacks).length} job callbacks, and ${Object.keys(this.batches).length} batches`);
        this.queuedJobs = [];
        this.finishedJobs = [];
        this.jobCompletionCallbacks = {};
        this.batches = {};
      } else {
        console.log(`[scheduled cleanup] [${new Date()}] processing in progress - skipping cleanup`);
      }
    });
  }

  add(options: JobOptions): JobType<JobOptions, JobData> {
    const job: Job<JobOptions, JobData> = new Job<JobOptions, JobData>({ options });
    this.queuedJobs.push(job);

    // track job completion callback if provided
    if (options.completionCallback) {
      this.jobCompletionCallbacks[job.getId()] = options.completionCallback;
    }

    this.startProcessing();
    return job;
  }

  addToBatch(options: JobOptions, batch: BatchType<JobOptions, JobData>): JobType<JobOptions, JobData> {
    const job: Job<JobOptions, JobData> = new Job<JobOptions, JobData>({ options, batch: batch.getId() } as { options: JobOptions, batch: string });
    batch.addJob(job);

    // save reference to batch
    this.batches[batch.getId()] = batch;

    this.queuedJobs.push(job);

    // track job completion callback if provided
    if (options.completionCallback) {
      this.jobCompletionCallbacks[job.getId()] = options.completionCallback;
    }

    this.startProcessing();
    return job;
  }

  async startProcessing() {
    if (this.processingJobs.length >= CONCURRENT_WORKER_THREADS || this.queuedJobs.length === 0) return;

    console.log(`startProcessing with queue length ${this.queuedJobs.length} and currently processing jobs ${this.processingJobs.length}`);

    // @ts-expect-error if .shift() returns undefined, I've got bigge problems
    const job: JobType<JobOptions, JobData> = this.queuedJobs.shift();

    // update batch status if job is part of a batch
    this.updateJobBatch(job);

    // mark job as processing
    this.processingJobs.push(job);

    // initialize worker thread to process job - thread will exit when job is finished processing
    const worker: Worker = new Worker(path.join(__dirname, 'Worker'));
    worker.on('message', this.onWorkerResponse.bind(this));
    worker.on('exit', (status) => {
      console.log('worker exited with status', status);
    });
    worker.postMessage({ jobJson: job.asJSON(), processJobExportPath: this.processJobExportPath });
  }

  getQueuedJobs(): JobType<JobOptions, JobData>[] {
    return this.queuedJobs;
  }

  getProcessingJobs(): JobType<JobOptions, JobData>[] {
    return this.processingJobs;
  }

  getFinishedJobs(): JobType<JobOptions, JobData>[] {
    return this.finishedJobs;
  }

  private updateJobBatch(job: JobType<JobOptions, JobData>) {
    const jobBatchId: string | null = job.getBatch();
    if (jobBatchId) {
      const batch: BatchType<JobOptions, JobData> = this.batches[jobBatchId];
      if (batch) {
        batch.update(job);
      }
    }
  }

  private async onWorkerResponse(response: WorkerResponse) {
    const finishedJob: JobType<JobOptions, JobData> = Job.fromJSON(response.jobJson);

    // execute job completion callback if provided;
    //  NOTE: callback is executed asynchronously in background and result is NOT awaited
    if (this.jobCompletionCallbacks[finishedJob.getId()]) {
      this.jobCompletionCallbacks[finishedJob.getId()](finishedJob);
    }

    // mark job completed
    const completedJobIndex: number = this.processingJobs.findIndex((job: JobType<JobOptions, JobData>) => job.getId() === finishedJob.getId());
    if (completedJobIndex != -1 && this.processingJobs[completedJobIndex]) { // Array.findIndex returns -1 if not found
      this.processingJobs.splice(completedJobIndex, 1);
    } else {
      console.error(`error: unable to find finished job id ${finishedJob.getId()} in processing jobs - available worker thread will not be released`);
    }
    this.finishedJobs.push(finishedJob);

    // continue processing if more jobs in queue
    this.startProcessing();

    // update batch status if job is part of a batch
    this.updateJobBatch(finishedJob);
  }
}
