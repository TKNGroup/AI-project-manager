import fs from "fs";
import path from "path";
import { logWarn } from "../logger/logger";
import { PackageInfo } from "../common/types/package-info";
import { PackageJson } from "../common/types/package-json";

export function scanPackages(workspaceRoot: string): PackageInfo[] {
    const packagesDir = path.join(workspaceRoot, "packages");
    const dirs = fs.readdirSync(packagesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    const internalPackageNames = new Set(dirs.map(d => {
        const pkgJsonPath = path.join(packagesDir, d, "package.json");

        if (!fs.existsSync(pkgJsonPath)) {
            logWarn("package.json not found", { dir: d });

            return null;
        }
        
        const pkgJson: PackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));

        return pkgJson.name;
    }).filter(Boolean) as string[]);

    const packages: PackageInfo[] = [];

    for (const dirName of dirs) {
        const packageJsonPath = path.join(packagesDir, dirName, "package.json");

        if (!fs.existsSync(packageJsonPath)) {
            continue;
        }

        const pkgJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

        const deps = [
            ...Object.keys(pkgJson.dependencies || {}),
            ...Object.keys(pkgJson.devDependencies || {})
        ].filter(dep => internalPackageNames.has(dep));

        packages.push({
            name: pkgJson.name,
            dir: path.join(packagesDir, dirName),
            dependencies: deps
        });
    }

    return packages;
}
