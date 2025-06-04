import {Job} from '../src/Job';
import type {JobType} from '../src/types/Job';
import type { JobTestOptions, JobTestData } from './types';

describe('Job tests', () => {
  let job: JobType<JobTestOptions, JobTestData>;
  let options: JobTestOptions;
  let data: JobTestData;

  beforeEach(() => {
    options = {
      testOption: 'testValue',
      testObject: {
        key: 'testKey',
        value: 42
      }
    };
    data = {
      testField: 'testData',
      nestedObject: {
        key: 'nestedKey',
        value: 100
      }
    };

    job = new Job({
      id: 'job1',
      data,
      options
    });
  });

  test('creation and accessors', () => {
    job = new Job<JobTestOptions, JobTestData>({});
    
    expect(job.getId()).toBeDefined();
    expect(job.getData()).toEqual({});
    expect(job.getOptions()).toEqual({});
    expect(job.getStatus()).toBe('pending');
    expect(job.getDuration()).toEqual({});
    expect(job.getBatch()).toBeNull();
  });

  test('creation with data and options', () => {
    expect(job.getId()).toBe('job1');
    expect(job.getData()).toEqual(data);
    expect(job.getOptions()).toBe(options);
    expect(job.getStatus()).toBe('pending');
    expect(job.getDuration()).toEqual({});
    expect(job.getBatch()).toBeNull();
  });

  test('json serialization', () => {
    const jobJson = job.asJSON();
    expect(jobJson).toBe('{\"id\":\"job1\",\"status\":\"pending\",\"options\":{\"testOption\":\"testValue\",\"testObject\":{\"key\":\"testKey\",\"value\":42}},\"duration\":{},\"data\":{\"testField\":\"testData\",\"nestedObject\":{\"key\":\"nestedKey\",\"value\":100}},\"batchId\":null}');
    
    const newJob = Job.fromJSON<JobTestOptions, JobTestData>(jobJson);
    expect(newJob.getId()).toBe('job1');
    expect(newJob.getData()).toEqual(data);
    expect(newJob.getOptions()).toEqual(options);
    expect(newJob.getStatus()).toBe('pending');
    expect(newJob.getDuration()).toEqual({});
    expect(newJob.getBatch()).toBeNull();
  });

  test('duration set after status update', () => {
    job.updateStatus('processing');
    expect(job.getStatus()).toBe('processing');
    expect(job.getDuration().start).toBeDefined();
    expect(job.getDuration().end).toBeUndefined();
    
    job.updateStatus('completed');
    expect(job.getStatus()).toBe('completed');
    expect(job.getDuration().end).toBeDefined();
    expect(job.getDuration().duration).toBeGreaterThan(0);
    
    job.updateStatus('failed');
    expect(job.getStatus()).toBe('failed');
  });

  test('update data', () => {
    expect(job.getData()).toEqual(data);
    
    // perform update
    const newData: JobTestData = {
      testField: 'updatedData',
      nestedObject: {
        key: 'updatedKey',
        value: 200
      }
    };
    job.updateData(newData);
    expect(job.getData()).toEqual(newData);
  });
});
