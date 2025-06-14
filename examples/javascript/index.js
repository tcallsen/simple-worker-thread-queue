import { fileURLToPath } from 'url';
import path from 'path';

import { Queue } from 'simple-worker-thread-queue';

const queue = new Queue({
  processJobExportPath: path.join(path.dirname(fileURLToPath(import.meta.url)), './CustomWorker.js'),
});

const completionCallback = async (completedJob) => {
  console.log(`job ${completedJob.getId()} completed with result: ${completedJob.getData().message}`);
};

const jobOptions = {
  name: 'Taylor',
  completionCallback,
};

const job = queue.add(jobOptions);
