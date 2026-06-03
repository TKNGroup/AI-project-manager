import { PackageInfo } from "../common/types/package-info";

export function topologicalSort<T extends PackageInfo>(packages: T[]): T[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const sorted: T[] = [];
    const map = new Map(packages.map(p => [p.name, p]));

    function visit(pkg: T) {
        if (visited.has(pkg.name)) {
            return;
        }

        if (temp.has(pkg.name)) {
            throw new Error(`Circular dependency detected: ${pkg.name}`);
        }

        temp.add(pkg.name);

        for (const dep of pkg.dependencies) {
            const depPkg = map.get(dep);
            if (depPkg) visit(depPkg);
        }

        temp.delete(pkg.name);
        visited.add(pkg.name);
        sorted.push(pkg);
    }

    for (const pkg of packages) {
        visit(pkg);
    }

    return sorted;
}
