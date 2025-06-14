import { fileURLToPath } from 'url';
import path from 'path';

import { type QueueOptions, type QueueType, type BatchCompletionCallback, type BatchType, type JobType, Queue, Batch, } from 'simple-worker-thread-queue';
import type { ExampleJobData, ExampleJobOptions } from './types';

// create Queue with options pointing to the worker file
const queueOptions: QueueOptions = {
  // @ts-expect-error module target for import.meta not important for example
  processJobExportPath: path.join(path.dirname(fileURLToPath(import.meta.url)), './CustomWorker.ts'),
};
const queue: QueueType<ExampleJobOptions, ExampleJobData> = new Queue<ExampleJobOptions, ExampleJobData>(queueOptions);

// create batch with completion callback
export const completionCallback: BatchCompletionCallback<ExampleJobOptions, ExampleJobData> = async function (completedBatch: BatchType<ExampleJobOptions, ExampleJobData>) {
  console.log(`batch ${completedBatch.getId()} completed with ${completedBatch.getJobs().length} jobs`);
}
const batch: BatchType<ExampleJobOptions, ExampleJobData> = new Batch(completionCallback);

// add 2 jobs to the queue as part of the batch
const job1Options = {
  name: 'James Polk',
};

const job2Options = {
  name: 'Hank Mardukas',
};

const job1: JobType<ExampleJobOptions, ExampleJobData> = queue.addToBatch(job1Options, batch);
const job2: JobType<ExampleJobOptions, ExampleJobData> = queue.addToBatch(job2Options, batch);
