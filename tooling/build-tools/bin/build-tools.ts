#!/usr/bin/env bun
import process from "process";
import { parseArgs } from 'util'
import {watchTask} from "@/watch.task";
import { logError, setLogger } from "@/logger/logger";
import {scanApps} from "@/workspace/scan-apps";
import {scanPackages} from "@/workspace/scan-packages";
import {BUILD_CACHE_SUFFIX, BUILD_FOLDER, BUILD_LOCK_SUFFIX} from "@/common/constants/common";
import path from "path";
import fs from "fs";
import {buildTask} from "@/build.task";
import {affectedTask} from "@/affected.task";

const mode = process.argv[2];

switch (mode) {
    case 'watch': {
        const parsedArgs = parseArgs({
            args: Bun.argv.slice(3),
            options: {
                package: { type: 'string', short: 'p' },
                task: { type: 'string', short: 't' },
                quiet: { type: 'boolean', short: 'q', default: false }
            },
        })

        if (parsedArgs.values.quiet) {
            setLogger(() => {});
        }

        if (parsedArgs.values.package === undefined) {
            logError(`package not provided`);

            process.exit(1)
        }

        if (parsedArgs.values.task === undefined) {
            logError(`task not provided`);

            process.exit(1)
        }

        await watchTask(process.cwd(), parsedArgs.values.package, parsedArgs.values.task, {
            forceBuild: false,
        });

        break;
    }
    case 'build': {
        const parsedArgs = parseArgs({
            args: Bun.argv.slice(3),
            options: {
                package: { type: 'string', short: 'p' },
                task: { type: 'string', short: 't' },
                quiet: { type: 'boolean', short: 'q', default: false }
            },
        })

        if (parsedArgs.values.quiet) {
            setLogger(() => {});
        }

        if (parsedArgs.values.package === undefined) {
            logError(`package not provided`);

            process.exit(1)
        }

        if (parsedArgs.values.task === undefined) {
            logError(`task not provided`);

            process.exit(1)
        }

        await buildTask(process.cwd(), parsedArgs.values.package, parsedArgs.values.task, {
            forceBuild: false,
        });

        break;
    }
    case 'affected': {
        const parsedArgs = parseArgs({
            args: Bun.argv.slice(3),
            options: {
                task: { type: 'string', short: 't' },
                quiet: { type: 'boolean', short: 'q', default: false }
            },
        })

        if (parsedArgs.values.quiet) {
            setLogger(() => {});
        }

        if (parsedArgs.values.task === undefined) {
            logError(`task not provided`);

            process.exit(1)
        }

        await affectedTask(process.cwd(), parsedArgs.values.task);

        break;
    }
    case 'reset': {
        const workspaceRoot = process.cwd();

        const allPackages = scanPackages(workspaceRoot);
        const allApps = scanApps(workspaceRoot, allPackages);

        for (const packageInfo of [...allApps, ...allPackages]) {
            const buildRoot = path.join(packageInfo.dir, BUILD_FOLDER);

            if (!fs.existsSync(buildRoot)) {
                continue
            }

            const files = fs.readdirSync(buildRoot, { withFileTypes: true })
                .filter(d => d.isFile() && d.name.endsWith(BUILD_CACHE_SUFFIX) || d.name.endsWith(BUILD_LOCK_SUFFIX))
                .map(d => d.name);

            for (const file of files) {
                fs.rmSync(path.join(buildRoot, file))
            }
        }

        break;
    }
    case 'clean': {
        const workspaceRoot = process.cwd();

        const allPackages = scanPackages(workspaceRoot);
        const allApps = scanApps(workspaceRoot, allPackages);

        for (const packageInfo of [...allApps, ...allPackages]) {
            const packageNodeModules = path.join(packageInfo.dir, 'node_modules');

            if (fs.existsSync(packageNodeModules)) {
                fs.rmSync(packageNodeModules, { recursive: true, force: true });
            }

            const packageDist = path.join(packageInfo.dir, 'dist');

            if (fs.existsSync(packageDist)) {
                fs.rmSync(packageDist, { recursive: true, force: true });
            }
        }

        break;
    }
    default: {
        logError(`command not found: ${mode}`);

        process.exit(1)
    }
}
