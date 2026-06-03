import path from "path";
import { scanPackages } from "./workspace/scan-packages";
import { scanApps } from "./workspace/scan-apps";
import { getTargetChainWithApp } from "./workspace/target-graph";
import type {PackageBuildInfo} from "./build/package-build-info";
import type {BuildContext} from "@/build/build-context";
import { readBuildConfig } from "./build/read-build-config";
import { computeMetaHash } from "@/utils/compute-meta-hash.util";
import { DEFAULT_BUILD_PATHES } from "@/common/constants/common";
import {needToRebuildPackage} from "@/build/need-to-rebuild-package";
import type {PackageInfo} from "@/common/types/package-info";

function normalizePackageName(name: string): string {
    return name
        .replace(/^@/, "")
        .replace(/[\/.@-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();
}

export async function affectedTask(workspaceRoot: string, task: string): Promise<void> {
    const allPackages = scanPackages(workspaceRoot);
    const allApps = scanApps(workspaceRoot, allPackages);

    // @info: hack for get chain for all applications
    const hack: PackageInfo = {
        dir: '',
        name: 'root',
        dependencies: allApps.map(app => app.name),
    }

    const chain = getTargetChainWithApp(hack, [...allPackages, ...allApps]);

    chain.pop();

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

        chainWithBuildInfo.push({
            ...pkg,
            forceBuild: false,
            config: buildConfig,
            task: buildTask,
            hasRun: false,
            hash: currentHash,
            computeMetaHashPaths: computeMetaHashPaths,
        });
    }

    const context = {
        packages: chainWithBuildInfo,
    } satisfies BuildContext

    const affectedProjects: string[] = [];

    for (const pkg of chainWithBuildInfo) {
        const isAffected = needToRebuildPackage(pkg, context.packages);

        if (!isAffected) {
            continue
        }

        const normalizedName = normalizePackageName(pkg.name);

        affectedProjects.push(normalizedName);
    }

    console.log(affectedProjects.join(" "));
}
