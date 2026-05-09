declare module 'fast-text-encoding' {
  export class TextEncoder {
    constructor(encoding?: string);
    encode(input?: string): Uint8Array;
  }
  export class TextDecoder {
    constructor(encoding?: string);
    decode(input?: Uint8Array): string;
  }
}
