import { v4 as uuidv4 } from 'uuid';
import type { JobDataBase, JobDuration, JobOptionsBase, JobStatus, JobType } from './types/Job';

export class Job<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase> implements JobType {
  private readonly id: string;
  private status: JobStatus;
  private options: JobOptions;
  private data: JobData;
  private duration: JobDuration;
  private batch: string | null;

  constructor({ id, options, status, duration, data, batch }: { id?: string, options?: JobOptions, status?: JobStatus, duration?: JobDuration, data?: JobData, batch?: string }) {
    this.id = id || `job-${Date.now()}-${uuidv4()}`;
    this.status = status || 'pending';
    this.options = options || {} as JobOptions;
    this.data = data || {} as JobData;
    this.duration = duration || {};
    this.batch = batch || null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData(newData: any): void {
    this.data = {
      ...this.data,
      ...newData,
    };
  }

  updateStatus(newStatus: JobStatus): void {
    // mark start time when job marked as processing
    if (newStatus === 'processing') {
      this.duration.start = Date.now();
    }

    // if status is completed or failed, set duration
    if (this.duration.start && (newStatus === 'completed' || newStatus === 'failed')) {
      this.duration.end = Date.now();
      this.duration.duration = this.duration.end - this.duration.start;
    }

    this.status = newStatus;
    console.log(`Job '${this.id}' status updated to '${this.status}'`);
  }

  asJSON(): string {
    return JSON.stringify({
      id: this.id,
      status: this.status,
      options: this.options,
      duration: this.duration,
      data: this.data,
      batchId: this.batch,
    });
  }

  static fromJSON<JobOptions extends JobOptionsBase = JobOptionsBase, JobData extends JobDataBase = JobDataBase>(json: string): JobType<JobOptions, JobData> {
    const jobJsonObject: {
      id: string
      status: JobStatus
      options: JobOptions
      duration: JobDuration
      data: JobData
      batchId?: string
    } = JSON.parse(json);
    return new Job<JobOptions, JobData>({ data: jobJsonObject.data, duration: jobJsonObject.duration, id: jobJsonObject.id, status: jobJsonObject.status, options: jobJsonObject.options, batch: jobJsonObject.batchId });
  }

  getId(): string {
    return this.id;
  }

  getStatus(): JobStatus {
    return this.status;
  }

  getOptions(): JobOptions {
    return this.options;
  }

  getDuration(): JobDuration {
    return this.duration;
  }

  getData(): JobData {
    return this.data;
  }

  getBatch(): string | null {
    return this.batch;
  }
}
