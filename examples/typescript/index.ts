import { fileURLToPath } from 'url';
import path from 'path';

import { type JobCompletionCallback, type JobType, type QueueOptions, type QueueType, Queue } from 'simple-worker-thread-queue';
import type { ExampleJobData, ExampleJobOptions } from './types';

// create Queue with options pointing to the worker file
const queueOptions: QueueOptions = {
  // @ts-expect-error module target for import.meta not important for example
  processJobExportPath: path.join(path.dirname(fileURLToPath(import.meta.url)), './CustomWorker.ts'),
};
const queue: QueueType<ExampleJobOptions, ExampleJobData> = new Queue<ExampleJobOptions, ExampleJobData>(queueOptions);

// create Job with completion callback
const completionCallback: JobCompletionCallback = async (completedJob: JobType<ExampleJobOptions, ExampleJobData>) => {
  console.log(`job ${completedJob.getId()} completed with result: ${completedJob.getData().message}`);
};

const jobOptions: ExampleJobOptions = {
  name: 'Taylor',
  completionCallback,
};

// add job to the queue
const job: JobType<ExampleJobOptions, ExampleJobData> = queue.add(jobOptions);
