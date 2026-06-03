export type LogLevel = "info" | "warn" | "error";

export interface LogPayload {
    timestamp: number;
    level: LogLevel;
    message: string;
    data: Record<string, unknown>;
}

type LoggerFn = (payload: LogPayload) => void;

let logImplementation: LoggerFn = (payload) => {
    const fields = [
        `[${payload.level}]`,
        payload.data['package'] == null ? null : `[package: ${payload.data['package']}]`,
        `${payload.message}`,
    ].filter(Boolean)

    console.log(fields.join(' '));

    if (payload.data['error'] !== undefined) {
        console.error(payload.data['error'])
    }
};

export function setLogger(fn: LoggerFn): void {
    logImplementation = fn;
}

export function log(level: LogLevel, message: string, data: Record<string, unknown> = {}): void {
    const payload: LogPayload = {
        timestamp: Date.now(),
        level,
        message,
        data: data
    };
    logImplementation(payload);
}

export const logInfo = (message: string, data: Record<string, unknown> = {}) => log("info", message, data);
export const logWarn = (message: string, data: Record<string, unknown> = {}) => log("warn", message, data);
export const logError = (message: string, data: Record<string, unknown> = {}) => log("error", message, data);
