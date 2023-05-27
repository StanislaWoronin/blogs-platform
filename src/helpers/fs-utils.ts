import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readFile, writeFile } from 'node:fs';

export const readTextFileAsync = (relativePath: string) => {
  return new Promise((resolve, reject) => {
    const rootDirPath = dirname(require.main.path);
    const filePath = join(rootDirPath, relativePath);

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

export const ensureDirSync = (relativePath: string): void => {
  new Promise<void>((resolve, reject) => {
    const rootDirPath = dirname(require.main.filename);
    const dirPath = join(rootDirPath, relativePath);

    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    resolve();
  });
};

export const saveFileAsync = (relativePath: string, data: Buffer) => {
  return new Promise<void>((resolve, reject) => {
    const rootDirPath = dirname(require.main.filename);
    const filePath = join(rootDirPath, relativePath);

    writeFile(filePath, data, (err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve();
    });
  });
};
