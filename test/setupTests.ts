import { jest } from "@jest/globals";
import { WorkerMockClass } from "./utils/WorkerMockClass";

// mock node-cron to prevent open handles on test compleition
jest.mock('node-cron');

// mock worker threads
const mockWorker = (filePath: string) => {
  return new WorkerMockClass(filePath)
}
jest.mock('worker_threads', () => ({
  Worker: jest.fn().mockImplementation(() => {
    return mockWorker('./test/worker.js');
  }) as jest.Mock
}));