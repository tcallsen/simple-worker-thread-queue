# Simple Worker Thread Queue

Provides an simply in-memory queue that manages the processing of jobs. Jobs are processed asychronously with Node.js [Worker Threads](https://nodejs.org/api/worker_threads.html).

Queue behavior is as follows:

- Queue exists only in-memory, not persisted
- Jobs begin processing immediately when added
- Jobs are processed sequentially one at a time, unless the `CONCURRENT_WORKER_THREADS` configuration in a `.env` file is greater than 1
- Optional completion callbacks can be provided to Jobs or Batches to track processing completion

## Install

To install as a dependency in your project:

```
npm install simple-worker-thread-queue
```

## Use

Typescript examples are available in [./examples/typescript](./examples/typescript), but the basic steps are:

1. Define a custom Job processing function in a seperate file and export it as `processJob`.

```
// CustomWorker.js
export async function processJob (jobOptions, job) {
  const result = {
    message: `Hello ${jobOptions.name}`,
  };
  // result will be saved to the job data
  return result;
};
```

2. Create a `Queue` in your project file and pass the absolute path to the file exporting `processJob`.

```
import { Queue } from 'simple-worker-thread-queue';

const queue = new Queue({
  processJobExportPath: path.join(__dirname, './CustomWorker.js')
});
```

3. Add a `Job` to the `Queue`. Monitor `Job` completion with a `completionCallback` function.

```
const completionCallback = async (completedJob) => {
  console.log(`job ${completedJob.getId()} completed with result: ${completedJob.getData().message}`);
};

const jobOptions = {
  name: 'Taylor',
  completionCallback,
};

const job = queue.add(jobOptions);
```

## Batches

Jobs can be grouped together into a `Batch`. By supplying a batch completion callback function, consuming services can be nofitied when the processing of the batched jobs is complete.

```
import { Batch } from 'simple-worker-thread-queue';

const completionCallback = async function (completedBatch) {
  console.log(`batch ${completedBatch.getId()} completed with ${completedBatch.getJobs().length} jobs`);
}
const batch = new Batch(completionCallback);

// add jobs to queue with batch parameter
const job1 = queue.addToBatch(job1Options, batch);
const job2 = queue.addToBatch(job2Options, batch);

```

## Example Usage

This package is used in one of my other projects, where it performs the queuing and execution of video conversion jobs created from a REST API: https://github.com/tcallsen/video-conversion-rest-api

![Diagram showing components and interactions of a Vido Transcoding REST API](https://raw.githubusercontent.com/tcallsen/video-conversion-rest-api/refs/heads/main/docs/Video%20Converstion%20REST%20API%20v1.drawio.svg)

This module makes up the `In-memory Queue` in the diagram above.

In that project, `JobOptionsBase` and `JobDataBase` are both extended to include use-case specific data: https://github.com/tcallsen/video-conversion-rest-api/blob/main/src/types/TranscodeJob.ts

## Inspiration

When AWS announced it would be [discontinuing support for their Elastic Transcoder](https://aws.amazon.com/elastictranscoder/faqs/) service, I created a small [REST-based service](https://github.com/tcallsen/video-conversion-rest-api) to replace it (mentioned above). As part of this service I needed simple job queuing, with job processing offloaded so the main thread could handle further REST requests. 

Existing queuing solutions like [BullMQ](https://bullmq.io/) were feature rich but overkill. I spun the queueing code I created off as a seperate npm package incase it could be used else-where.

Here is a link to a [blog post](https://taylor.callsen.me/creating-an-open-source-video-conversion-service/) I wrote with more information about the service mentioned above.
