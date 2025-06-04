import type { JobDataBase, JobOptionsBase } from "../../src/types/Job";

export interface JobTestOptions extends JobOptionsBase {
  testOption: string;
  testObject: {
    key: string;
    value: number;
  };
}

export interface JobTestData extends JobDataBase {
  testField: string;
  nestedObject: {
    key: string;
    value: number;
  };
}

export const TestWorkerJobDataResponse = {
  testField: 'worker-mock',
  nestedObject: {
    key: 'percent',
    value: 100,
  },
} as JobTestData
