import crypto from "crypto";
import fs from "fs";
import path from "path";

export function computeMetaHash(paths: string[], inputHash?: crypto.Hash): string | null {
    const hash = inputHash ? inputHash : crypto.createHash("sha1");

    for (const pathItem of paths) {
        const statInfo = fs.statSync(pathItem);

        if (statInfo.isDirectory()) {
            const directoryEntries = fs.readdirSync(pathItem, { withFileTypes: true });
            const fullPaths = directoryEntries.map((e) => path.join(pathItem, e.name));

            computeMetaHash(fullPaths, hash);
        } else {
            const statInfo = fs.statSync(pathItem);

            const fileInfo = `${pathItem}:${statInfo.size}:${statInfo.mtimeMs}`;

            hash.update(fileInfo);
        }
    }

    if (inputHash === undefined) {
        return hash.digest().toString("base64");
    }

    return null;
}
