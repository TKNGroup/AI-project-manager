import { PackageInfo } from "../common/types/package-info";

export function findTargetByName<T extends PackageInfo>(targetName: string, allPackages: T[], allApps: T[]): T {
    const pkg = allPackages.find(p => p.name === targetName);

    if (pkg) {
        return pkg;
    }

    const app = allApps.find(a => a.name === targetName);
    
    if (app) {
        return app;
    }

    throw new Error(`Target not found: ${targetName}`);
}