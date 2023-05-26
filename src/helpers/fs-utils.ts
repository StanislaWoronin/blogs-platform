import {dirname, join} from "node:path";
import {readFile} from "node:fs";

export const readTextFileAsync = (relativePath: string) => {
    return new Promise((resolve, reject) => {
        const rootDirPath = dirname(require.main.path);
        const filePath = join(rootDirPath, relativePath);
        console.log(rootDirPath)
        console.log(__dirname)
        console.log(filePath)
        readFile(
            filePath,
            {
                encoding: 'utf-8',
            },
            (err, content) => {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(content);
            },
        );
    });
};