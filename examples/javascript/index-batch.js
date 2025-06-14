import { fileURLToPath } from 'url';
import path from 'path';

import { Queue, Batch } from 'simple-worker-thread-queue';

// create queue
const queue = new Queue({
  processJobExportPath: path.join(path.dirname(fileURLToPath(import.meta.url)), './CustomWorker.js'),
});

// create batch with completion callback
export const completionCallback = async function (completedBatch) {
  console.log(`batch ${completedBatch.getId()} completed with ${completedBatch.getJobs().length} jobs`);
}
const batch = new Batch(completionCallback);

// add 2 jobs to the queue as part of the batch
const job1Options = {
  name: 'James Polk',
};

const job2Options = {
  name: 'Hank Mardukas',
};

const job1 = queue.addToBatch(job1Options, batch);
const job2 = queue.addToBatch(job2Options, batch);
