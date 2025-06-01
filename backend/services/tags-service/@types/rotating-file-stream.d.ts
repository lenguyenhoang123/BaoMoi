declare module 'rotating-file-stream' {
  import { Writable } from 'stream';

  interface RotatingFileStreamOptions {
    size?: string;
    interval?: string;
    path?: string;
    maxFiles?: number;
    maxSize?: string;
    mode?: number;
    compress?: boolean | string;
    encoding?: string;
    immutable?: boolean;
    initialRotation?: boolean;
    history?: string;
    rotate?: number;
    maxSizeCompressed?: string;
    teeToStdout?: boolean;
  }

  function rfs(
    filename: string,
    options?: RotatingFileStreamOptions
  ): Writable;

  export = rfs;
}
