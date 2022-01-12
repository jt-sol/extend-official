import path from "path";
import {CACHE_PATH} from "./constants";
import fs from "fs";

export function cachePath(
  env: string,
  cacheName: string,
  cPath: string = CACHE_PATH
) {
  return path.resolve(path.join(cPath, `${env}-${cacheName}.json`));
}

export function loadCache(
  neighborhoodRow: number,
  neighborhoodCol: number,
  cacheName: string,
  env: string,
  cPath: string = CACHE_PATH
) {
  const path = cachePath(env, cacheName, cPath);
  return fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path).toString())[
      `[${neighborhoodRow},${neighborhoodCol}]`
      ]
    : undefined;
}

export function saveCache(
  neighborhoodRow: number,
  neighborhoodCol: number,
  cacheName: string,
  env: string,
  cacheContent,
  cPath: string = CACHE_PATH
) {
  const path = cachePath(env, cacheName, cPath);
  const cacheResult = fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path).toString())
    : {};
  cacheResult[`[${neighborhoodRow},${neighborhoodCol}]`] = cacheContent;
  cacheResult["env"] = env;
  cacheResult["cacheName"] = cacheName;

  fs.writeFileSync(
    cachePath(env, cacheName, cPath),
    JSON.stringify(cacheResult)
  );
}


export function loadBase(
  cacheName: string,
  env: string,
  cPath: string = CACHE_PATH
) {
  const path = cachePath(env, cacheName, cPath);
  return fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path).toString())[
      `base` 
      ]
    : undefined;
}

export function saveBase(
  cacheName : string,
  env : string,
  cacheContent,
  cPath : string = CACHE_PATH
){
  const path = cachePath(env, cacheName, cPath);
  const cacheResult = fs.existsSync(path)
  ? JSON.parse(fs.readFileSync(path).toString())
  : {};

  cacheResult[`base`] = cacheContent;
  cacheResult["env"] = env;
  cacheResult["cacheName"] = cacheName;

  fs.writeFileSync(
    cachePath(env, cacheName, cPath),
    JSON.stringify(cacheResult)
  );
}
