import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { install } from 'react-native-quick-crypto';
install();

import { registerGlobals } from '@livekit/react-native';
registerGlobals();

// Polyfill WebSocket prototype for LiveKit WebSocketStream
if (typeof global.WebSocket !== 'undefined' && typeof global.WebSocket.prototype === 'undefined') {
  (global.WebSocket as any).prototype = Object.create(Object.prototype);
}

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

// Minimal AudioContext mock
if (typeof (global as any).AudioContext === 'undefined') {
  (global as any).AudioContext = class AudioContext {
    createAnalyser() { return { getByteFrequencyData: () => {}, fftSize: 2048, connect: () => {}, disconnect: () => {} }; }
    createMediaStreamSource() { return { connect: () => {}, disconnect: () => {} }; }
    close() { return Promise.resolve(); }
  };
}

// Minimal ReadableStream polyfill
import { ReadableStream } from 'readable-stream';
if (typeof global.ReadableStream === 'undefined') {
  (global as any).ReadableStream = ReadableStream;
}

import { registerRootComponent } from 'expo';

// Ensure App is required after globals
const App = require('./App').default;
registerRootComponent(App);
