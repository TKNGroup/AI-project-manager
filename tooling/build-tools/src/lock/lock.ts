import fs from "fs";
import path from "path";
import {BUILD_FOLDER, BUILD_LOCK_SUFFIX} from "@/common/constants/common";

export type UnlockCallback = () => void;

const memoryLocks = new Set<string>();

export async function acquireLock(pkgDir: string, target: string): Promise<UnlockCallback> {
    fs.mkdirSync(pkgDir, { recursive: true });
    const lockFile = path.join(pkgDir, BUILD_FOLDER, `.${target}${BUILD_LOCK_SUFFIX}`);

    while (true) {
        try {
            const fd = fs.openSync(lockFile, "wx");
            fs.closeSync(fd);

            memoryLocks.add(pkgDir);

            return () => {
                memoryLocks.delete(pkgDir);
                
                if (fs.existsSync(lockFile)) {
                    fs.unlinkSync(lockFile);
                }
            };
        } catch (err: any) {
            if (err.code === "EEXIST") {
                await new Promise(r => setTimeout(r, 50));
                continue;
            } else {
                throw err;
            }
        }
    }
}

export function isLocked(pkgDir: string): boolean {
    const lockFile = path.join(pkgDir, BUILD_LOCK_SUFFIX);

    if (memoryLocks.has(pkgDir)) {
        return true;
    }

    if (fs.existsSync(lockFile)) {
        return true;
    }

    return false;
}
