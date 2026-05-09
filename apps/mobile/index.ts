import { install } from 'react-native-quick-crypto';
install();

import { registerGlobals } from '@livekit/react-native';
registerGlobals();

// Polyfill missing mediaDevices method that ElevenLabs expects
if (global.navigator?.mediaDevices && !(global.navigator.mediaDevices as any).getSupportedConstraints) {
  (global.navigator.mediaDevices as any).getSupportedConstraints = () => ({
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  });
}

import { Buffer } from 'buffer';
global.Buffer = Buffer;

import process from 'process';
global.process = process;

// Polyfill DOMException for web-centric SDKs like ElevenLabs
if (typeof global.DOMException === 'undefined') {
  (global as any).DOMException = class DOMException extends Error {
    constructor(message: string, name: string) {
      super(message);
      this.name = name;
    }
  };
}

// Additional polyfills for web SDKs
import { TextEncoder, TextDecoder } from 'fast-text-encoding';
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  (global as any).TextDecoder = TextDecoder;
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
