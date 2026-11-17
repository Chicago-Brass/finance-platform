/** Different run keys still share one sync lock. An unfinished batch must be resumed. */
export class SyncBusyError extends Error {
    readonly runKey: string;
    constructor(runKey: string) { super("A ledger sync is already running."); this.runKey = runKey; }
}
