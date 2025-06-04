import type { JobTestOptions, JobTestData } from './types';
import { Batch, type BatchType } from '../src';

// NOTE: majority of Batch functionality is tested through Queue tests
describe('Batch tests', () => {
  let batch: BatchType<JobTestOptions, JobTestData>;
  let options: JobTestOptions;

  beforeEach(() => {
    batch = new Batch<JobTestOptions, JobTestData>();
  });

  test('creation and accessors', () => {
    expect(batch.getId()).toBeDefined();
    expect(batch.getStatus()).toEqual('pending');
    expect(batch.getDuration()).toEqual({});
    expect(batch.getJobs()).toEqual([]);
  });
});
