import path from "path";
import { logInfo } from "./logger/logger";
import { scanPackages } from "./workspace/scan-packages";
import { scanApps } from "./workspace/scan-apps";
import { findTargetByName } from "./workspace/find-target";
import { getTargetChainWithApp } from "./workspace/target-graph";
import type {PackageBuildInfo} from "./build/package-build-info";
import {readLastBuild} from "./build/read-last-build";
import {buildChain} from "@/build/build-package-chain";
import type {BuildContext} from "@/build/build-context";
import { readBuildConfig } from "./build/read-build-config";
import { computeMetaHash } from "@/utils/compute-meta-hash.util";
import { DEFAULT_BUILD_PATHES } from "@/common/constants/common";

interface WatchBuildOptions {
    forceBuild?: boolean;
}

export async function buildTask(workspaceRoot: string, targetPackage: string, task: string, options: WatchBuildOptions): Promise<void> {
    const initializationStepStartAt = Date.now();

    const forceBuild = options.forceBuild === undefined ? false : options.forceBuild;

    const allPackages = scanPackages(workspaceRoot);
    const allApps = scanApps(workspaceRoot, allPackages);
    const targetPackageInfo = findTargetByName(targetPackage, allPackages, allApps);
    const chain = getTargetChainWithApp(targetPackageInfo, allPackages);

    const chainWithBuildInfo: PackageBuildInfo[] = [];

    for (const pkg of chain) {
        const buildConfig = readBuildConfig(pkg.dir);

        if (buildConfig === null) {
            throw new Error(`build config not found, package: ${pkg.name}, path: ${pkg.dir}`);
        }

        const buildTask = buildConfig.tasks.find((buildTask) => buildTask.id === task);

        if (buildTask === undefined) {
            throw new Error(`build task "${task}" not found, package: ${pkg.name}, path: ${pkg.dir}`);
        }

        const paths = buildTask.inputs === undefined ? DEFAULT_BUILD_PATHES : buildTask.inputs;
        const computeMetaHashPaths = paths.map((pathToHash) => path.join(pkg.dir, pathToHash));
        const currentHash = computeMetaHash(computeMetaHashPaths);
        const currentHash2 = readLastBuild(pkg.dir, buildTask.id);

        logInfo(`${pkg.name}, hash: ${currentHash2}, calculated: ${currentHash}, computeMetaHashPaths: ${computeMetaHashPaths.join(', ')}`)


        chainWithBuildInfo.push({
            ...pkg,
            forceBuild: forceBuild,
            config: buildConfig,
            task: buildTask,
            hasRun: false,
            hash: currentHash,
            computeMetaHashPaths: computeMetaHashPaths,
        });
    }

    const initializationStepEndAt = Date.now();

    logInfo(`initialized take ${(initializationStepEndAt - initializationStepStartAt) / 1000}s`)

    const context = {
        packages: chainWithBuildInfo,
    } satisfies BuildContext

    await buildChain(chainWithBuildInfo, context);
}
