import { PackageInfo } from "../common/types/package-info";
import { topologicalSort } from "./topological-sort";

export function getTargetChainWithApp<T extends PackageInfo>(target: T, allPackages: T[]): T[] {
    const pkgMap = new Map(allPackages.map(p => [p.name, p]));

    const visited = new Set<string>();
    const chain: T[] = [];

    function visit(pkgName: string) {
        if (visited.has(pkgName)) {
            return;
        }

        visited.add(pkgName);

        const pkg = pkgMap.get(pkgName);

        if (pkg === undefined) {
            return;
        }

        for (const dep of pkg.dependencies) {
            visit(dep);
        }

        chain.push(pkg);
    }

    for (const dep of target.dependencies) {
        if (!pkgMap.has(dep)) {
            continue
        }

        visit(dep);
    }

    chain.push(target);

    return topologicalSort(chain);
}
