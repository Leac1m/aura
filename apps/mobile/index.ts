import 'react-native-get-random-values';
import 'buffer';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Polyfill DOMException for web-centric SDKs like ElevenLabs
if (typeof global.DOMException === 'undefined') {
  (global as any).DOMException = class DOMException extends Error {
    constructor(message: string, name: string) {
      super(message);
      this.name = name;
    }
  };
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
