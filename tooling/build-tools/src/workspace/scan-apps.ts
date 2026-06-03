import fs from "fs";
import path from "path";
import { PackageInfo } from "../common/types/package-info";
import { PackageJson } from "../common/types/package-json";

export function scanApps(workspaceRoot: string, allPackages: PackageInfo[]): PackageInfo[] {
    const appsDir = path.join(workspaceRoot, "apps");

    if (!fs.existsSync(appsDir)) {
        return [];
    }

    const dirs: string[] = [];

    for (const dir of fs.readdirSync(appsDir, { withFileTypes: true })) {
        if (!dir.isDirectory()) {
            continue
        }

        dirs.push(dir.name);
    }

    const apps: PackageInfo[] = [];

    for (const dirName of dirs) {
        const pkgJsonPath = path.join(appsDir, dirName, "package.json");

        if (!fs.existsSync(pkgJsonPath)) {
            continue;
        }

        try {
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8")) as PackageJson;

            const deps = Object.keys(pkgJson.dependencies || {}).filter(dep =>
                allPackages.some(p => p.name === dep)
            );

            apps.push({
                name: pkgJson.name,
                dir: path.join(appsDir, dirName),
                dependencies: deps
            });
        } catch (error) {
            console.error(`Invalid package.json file: ${pkgJsonPath}`);
            throw error;
        }
    }

    return apps;
}