import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import type { JobTestOptions, JobTestData } from './Job.test';

import {Queue} from '../src/Queue';
import type { JobCompletionCallback, JobType } from '../src/types/Job';
import type { QueueType } from '../src/types/Queue';
import type { WorkerResponse } from '../src/types/Worker';

import { Worker as WorkerMock } from 'worker_threads';
import { Batch, BatchCompletionCallback } from '../src';

describe('Job tests', () => {
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
      processJobExportPath: './test/worker.js'
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

  test('process job', () => {
    const job: JobType<JobTestOptions, JobTestData> = queue.add(options);

    expect(job.getId()).toBeDefined();
    expect(job.getOptions()).toEqual(options);
    expect(WorkerMock).toHaveBeenCalledWith(expect.stringContaining('/Worker'));
    expect(queue.getProcessingJobs()).toHaveLength(1);
    expect(queue.getFinishedJobs()).toHaveLength(0);

    // TODO: is there a better way to access the mock instance?
    // @ts-expect-error accessing private mock instance
    const workerMockInstance = WorkerMock.mock.results[0].value;
    
    // confirm initial post message call to worker
    expect(workerMockInstance.postMessageMock).toHaveBeenCalledWith({ jobJson: job.asJSON(), processJobExportPath: './test/worker.js' });

    // simulate job completion - confirm worker completion callback into queue
    job.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job.asJSON(), status: 'completed' } as WorkerResponse);
    
    // confirm job moved to finished jobs
    expect(queue.getProcessingJobs()).toHaveLength(0);
    expect(queue.getFinishedJobs()).toHaveLength(1);
    expect(queue.getFinishedJobs()[0].getStatus()).toBe('completed');
  });

  test('process job with completion callback', () => {
    const completionCallback: JobCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    options.completionCallback = completionCallback;
    expect(completionCallback).not.toHaveBeenCalled();

    const job: JobType<JobTestOptions, JobTestData> = queue.add(options);
    
    // TODO: is there a better way to access the mock instance?
    // @ts-expect-error accessing private mock instance
    const workerMockInstance = WorkerMock.mock.results[0].value;

    // simulate job completion
    job.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job.asJSON(), status: 'completed' } as WorkerResponse);
    
    // confirm compleition callback is fired
    expect(queue.getFinishedJobs()[0].getStatus()).toBe('completed');
    expect(completionCallback).toHaveBeenCalledTimes(1);
  });

  test('process jobs in batch', () => {
    const batch: Batch<JobTestOptions, JobTestData> = new Batch<JobTestOptions, JobTestData>();
    const job: JobType<JobTestOptions, JobTestData> = queue.addToBatch(options, batch);
    const job2: JobType<JobTestOptions, JobTestData> = queue.addToBatch(options, batch);

    expect(queue.getProcessingJobs()).toHaveLength(1);
    expect(batch.getId()).toBeDefined();
    expect(batch.getJobs()).toHaveLength(2);
    expect(batch.getStatus()).toBe('processing');

    // TODO: is there a better way to access the mock instance?
    // @ts-expect-error accessing private mock instance
    const workerMockInstance = WorkerMock.mock.results[0].value;

    // simluate job 1 completion
    job.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job.asJSON(), status: 'completed' } as WorkerResponse);
    expect(queue.getProcessingJobs()).toHaveLength(1);
    expect(queue.getFinishedJobs()).toHaveLength(1);
    expect(batch.getStatus()).toBe('processing');

    // simluate job 2 completion
    job2.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job2.asJSON(), status: 'completed' } as WorkerResponse);
    expect(queue.getProcessingJobs()).toHaveLength(0);
    expect(queue.getFinishedJobs()).toHaveLength(2);
    expect(batch.getStatus()).toBe('completed');
  });

  test('batch completion callback', () => {
    const completionCallback: BatchCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    expect(completionCallback).not.toHaveBeenCalled();
    
    const batch: Batch<JobTestOptions, JobTestData> = new Batch<JobTestOptions, JobTestData>(completionCallback);
    const job: JobType<JobTestOptions, JobTestData> = queue.addToBatch(options, batch);
    const job2: JobType<JobTestOptions, JobTestData> = queue.addToBatch(options, batch);

    // TODO: is there a better way to access the mock instance?
    // @ts-expect-error accessing private mock instance
    const workerMockInstance = WorkerMock.mock.results[0].value;

    // simluate job 1 completion
    job.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job.asJSON(), status: 'completed' } as WorkerResponse);

    // simluate job 2 completion
    job2.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job2.asJSON(), status: 'completed' } as WorkerResponse);

    // confirm completio callback is fired
    expect(completionCallback).toHaveBeenCalledTimes(1);
  });

  test('batch completion callback and job completion callbacks', () => {
    // create batch with completion callback
    const batchCompletionCallback: BatchCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const batch: Batch<JobTestOptions, JobTestData> = new Batch<JobTestOptions, JobTestData>(batchCompletionCallback);
    
    // create job with completion callback
    const jobCompletionCallback: JobCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const jobOptions: JobTestOptions = {
      ...options,
      completionCallback: jobCompletionCallback
    };
    const job: JobType<JobTestOptions, JobTestData> = queue.addToBatch(jobOptions, batch);
    // create second job with completion callback
    const job2CompletionCallback: JobCompletionCallback<JobTestOptions, JobTestData> = jest.fn(async () => {});
    const job2Options: JobTestOptions = {
      ...options,
      completionCallback: job2CompletionCallback
    };
    const job2: JobType<JobTestOptions, JobTestData> = queue.addToBatch(job2Options, batch);

    expect(batchCompletionCallback).not.toHaveBeenCalled();
    expect(jobCompletionCallback).not.toHaveBeenCalled();
    expect(job2CompletionCallback).not.toHaveBeenCalled();

    // TODO: is there a better way to access the mock instance?
    // @ts-expect-error accessing private mock instance
    const workerMockInstance = WorkerMock.mock.results[0].value;

    // simluate job 1 completion
    job.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job.asJSON(), status: 'completed' } as WorkerResponse);

    expect(batchCompletionCallback).toHaveBeenCalledTimes(0);
    expect(jobCompletionCallback).toHaveBeenCalledTimes(1);
    expect(job2CompletionCallback).toHaveBeenCalledTimes(0);

    // simluate job 2 completion
    job2.updateStatus('completed'); // done in Worker.js but mocked out of this test here
    workerMockInstance.emit('message', { jobJson: job2.asJSON(), status: 'completed' } as WorkerResponse);

    // confirm batch and job completion callbacks are all called
    expect(batchCompletionCallback).toHaveBeenCalledTimes(1);
    expect(jobCompletionCallback).toHaveBeenCalledTimes(1);
    expect(job2CompletionCallback).toHaveBeenCalledTimes(1);
  });
});
