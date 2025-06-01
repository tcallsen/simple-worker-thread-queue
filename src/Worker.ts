import { parentPort } from 'worker_threads';

import type { JobDataBase, JobType } from './types/Job';
import type { WorkerMessage, WorkerResponse } from './types/Worker';

import { Job } from './Job';

if (!parentPort) {
  throw new Error('This file must be run as a worker thread!');
}

// start worker on message from queue
parentPort.on('message', async (options: WorkerMessage) => {
  const { jobJson, processJobExportPath } = options;

  // parse job from supplied JSON - exit with statuc code 1 if parsing fails
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  let job: JobType<any, JobDataBase>;
  try {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    job = Job.fromJSON<any, JobDataBase>(jobJson);
  } catch (error) {
    console.error('Error parsing job json - exiting worker', error);
    process.exit(1);
  }

  try {
    const { processJob } = await import(processJobExportPath);
    console.log(`worker importing processJob() from path: ${processJobExportPath}`);

    // mark job as processing
    console.log('Worker started processing', job.getId());
    job.updateStatus('processing');

    // begin processing job supplied with job options
    const jobOptions = job.getOptions();
    const jobData = await processJob(jobOptions, job);

    // write results (jobData) back to job
    job.updateData(jobData);
    job.updateStatus('completed');
  } catch (error: unknown) {
    console.error('Error processing job; marking as failed', error);
    job.updateData({ error: { error: (error as Error).stack, errorType: (error as Error).name, status: -1 } });
    job.updateStatus('failed');
  } finally {
    // @ts-expect-error verified this is set above
    parentPort.postMessage({
      status: job.getStatus(),
      jobJson: job.asJSON(),
    } as WorkerResponse);
    // close this worker thread
    process.exit();
  }
});
