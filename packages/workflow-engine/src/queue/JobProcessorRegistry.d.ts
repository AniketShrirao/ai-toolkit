import { Job } from "bullmq";
import { QueueManager } from "../interfaces/QueueManager.js";
export type JobProcessor = (job: Job) => Promise<any>;
export interface JobProcessorInfo {
    name: string;
    description: string;
    processor: JobProcessor;
    queueName: string;
}
export declare class JobProcessorRegistry {
    private processors;
    private queueManager;
    constructor(queueManager: QueueManager);
    registerProcessor(info: JobProcessorInfo): void;
    getProcessor(name: string): JobProcessorInfo | undefined;
    listProcessors(): JobProcessorInfo[];
    unregisterProcessor(name: string): boolean;
    registerBuiltInProcessors(): void;
}
//# sourceMappingURL=JobProcessorRegistry.d.ts.map