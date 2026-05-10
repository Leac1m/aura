import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Robust AudioContext Mock
const MockAudioContext = class {
  createAnalyser() { 
    return { 
      getByteFrequencyData: () => {}, 
      fftSize: 2048, 
      frequencyBinCount: 1024, 
      connect: () => {}, 
      disconnect: () => {},
      smoothingTimeConstant: 0.8,
    }; 
  }
  createMediaStreamSource() { return { connect: () => {}, disconnect: () => {} }; }
  createGain() { return { gain: { value: 1 }, connect: () => {}, disconnect: () => {} }; }
  close() { return Promise.resolve(); }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  get state() { return 'running'; }
  get sampleRate() { return 44100; }
  get currentTime() { return Date.now() / 1000; }
  decodeAudioData() { return Promise.resolve({}); }
};

const defineGlobal = (name: string, value: any) => {
  Object.defineProperty(global, name, {
    value,
    configurable: true,
    writable: true
  });
  if ((global as any).window) {
    (global as any).window[name] = value;
  }
};

defineGlobal('AudioContext', MockAudioContext);
defineGlobal('webkitAudioContext', MockAudioContext);

// Polyfill window and complete navigator for web-centric SDKs
if (typeof global.window === 'undefined') {
  defineGlobal('window', global);
}

const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';

if (typeof global.navigator === 'undefined') {
  defineGlobal('navigator', {
    userAgent,
    product: 'ReactNative',
    platform: 'iPhone',
    mediaDevices: {
      getUserMedia: () => Promise.reject(new Error('getUserMedia not polyfilled yet')),
    }
  });
}

// Ensure process and Buffer are global
import { Buffer } from 'buffer';
defineGlobal('Buffer', Buffer);

import process from 'process';
defineGlobal('process', process);
if (typeof (global as any).process.nextTick === 'undefined') {
  (global as any).process.nextTick = setImmediate;
}

// Polyfill ReadableStream
import { ReadableStream } from 'readable-stream';
defineGlobal('ReadableStream', ReadableStream);

// Polyfill DOMException
if (typeof global.DOMException === 'undefined') {
  const MockDOMException = class DOMException extends Error {
    constructor(message: string, name: string) {
      super(message);
      this.name = name || 'DOMException';
    }
  };
  defineGlobal('DOMException', MockDOMException);
}

// Additional polyfills for web SDKs
import { TextEncoder, TextDecoder } from 'fast-text-encoding';
defineGlobal('TextEncoder', TextEncoder);
defineGlobal('TextDecoder', TextDecoder);
