import path from 'path';

import type { JobTestOptions, JobTestData } from './types';
import type { JobCompletionCallback } from '../src/types/Job';
import type { QueueType } from '../src/types/Queue';

import {Queue} from '../src/Queue';
import { Batch, type BatchType, type BatchCompletionCallback } from '../src';

describe('Queue tests', () => {
  let queue: QueueType<JobTestOptions, JobTestData>;
  let options: JobTestOptions;

  beforeEach(() => {
    options = {
      testOption: 'testValue',
      testObject: {
        key: 'testKey',
        value: 42
      }
    };
    queue = new Queue<JobTestOptions, JobTestData>({
      // NOTE: tests must load compiled JS version of worker file since used in worker thread
      processJobExportPath: path.join(__dirname, '../dist/test/worker/TestWorker.js'),
    });
  });

  test('creation and accessors', () => {
    expect(queue.getFinishedJobs()).toEqual([]);
    expect(queue.getProcessingJobs()).toEqual([]);
    expect(queue.getQueuedJobs()).toEqual([]);
  });

  test('creation without options throws error', () => {
    const t = () => {
      // @ts-expect-error testing invalid options
      queue = new Queue<JobTestOptions, JobTestData>({});
    };
    expect(t).toThrow('Queue constructor requires options object of type QueueOptions');
  });

  test('process job with completion callback', async () => {
    let completionCallback: JobCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const completionCallbackHandle = new Promise<void>((resolve) => {
      completionCallback = jest.fn(async () => {
        resolve();
      });
    });
    options.completionCallback = completionCallback;
    expect(completionCallback).not.toHaveBeenCalled();

    queue.add(options);
   
    expect(queue.getQueuedJobs()).toHaveLength(0);
    expect(queue.getProcessingJobs()).toHaveLength(1);
    expect(queue.getFinishedJobs()).toHaveLength(0);

    // wait for async processing to complete by monitoring callback handle
    await Promise.all([completionCallbackHandle]);

    expect(queue.getFinishedJobs()[0].getStatus()).toBe('completed');

    // confirm compleition callback is fired
    expect(completionCallback).toHaveBeenCalledTimes(1);
  });

  test('process jobs in batch with batch completion callback', async() => {
    let completionCallback: BatchCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const completionCallbackHandle = new Promise<void>((resolve) => {
      completionCallback = jest.fn(async () => {
        resolve();
      });
    });
    
    expect(completionCallback).not.toHaveBeenCalled();
    
    const batch: BatchType<JobTestOptions, JobTestData> = new Batch<JobTestOptions, JobTestData>(completionCallback);
    queue.addToBatch(options, batch);
    queue.addToBatch(options, batch);

    expect(batch.getStatus()).toBe('processing');

    expect(queue.getQueuedJobs()).toHaveLength(1);
    expect(queue.getProcessingJobs()).toHaveLength(1);
    expect(queue.getFinishedJobs()).toHaveLength(0);

    // wait for async processing to complete by monitoring callback handle
    await Promise.all([completionCallbackHandle]);

    expect(queue.getQueuedJobs()).toHaveLength(0);
    expect(queue.getProcessingJobs()).toHaveLength(0);
    expect(queue.getFinishedJobs()).toHaveLength(2);

    expect(queue.getFinishedJobs()[0].getStatus()).toBe('completed');
    expect(queue.getFinishedJobs()[1].getStatus()).toBe('completed');
    expect(batch.getStatus()).toBe('completed');

    // confirm batch completion callback is fired
    expect(completionCallback).toHaveBeenCalledTimes(1);
  });

  test('batch completion callback and job completion callbacks', async () => {
    // create batch with completion callback
    let batchCompletionCallback: BatchCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const batchCompletionCallbackHandle = new Promise<void>((resolve) => {
      batchCompletionCallback = jest.fn(async () => {
        resolve();
      });
    });
    const batch: BatchType<JobTestOptions, JobTestData> = new Batch<JobTestOptions, JobTestData>(batchCompletionCallback);
    
    // create job with completion callback
    const jobCompletionCallback: JobCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const jobOptions: JobTestOptions = {
      ...options,
      completionCallback: jobCompletionCallback
    };
    queue.addToBatch(jobOptions, batch);
    // create second job with completion callback
    const job2CompletionCallback: JobCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const job2Options: JobTestOptions = {
      ...options,
      completionCallback: job2CompletionCallback
    };
    queue.addToBatch(job2Options, batch);

    expect(batchCompletionCallback).not.toHaveBeenCalled();
    expect(jobCompletionCallback).not.toHaveBeenCalled();
    expect(job2CompletionCallback).not.toHaveBeenCalled();

    // wait for async processing to complete by monitoring callback handle
    await Promise.all([batchCompletionCallbackHandle]);

    // confirm batch and job completion callbacks are all called
    expect(batchCompletionCallback).toHaveBeenCalledTimes(1);
    expect(jobCompletionCallback).toHaveBeenCalledTimes(1);
    expect(job2CompletionCallback).toHaveBeenCalledTimes(1);
  });
});
