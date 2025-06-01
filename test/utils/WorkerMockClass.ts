import { jest } from "@jest/globals";
import EventEmitter from "node:events";

export class WorkerMockClass extends EventEmitter {
  constructorMock = jest.fn();
  postMessageMock = jest.fn();
  terminateMock = jest.fn();
  
  constructor(stringUrl: string) {
    super();
    this.constructorMock(stringUrl);
  }

  postMessage(msg: any): void {
    // this.emit('message', msg);
    this.postMessageMock(msg);
  }

  terminate(): void {
    this.emit('exit');
    this.terminateMock();
  }
}
