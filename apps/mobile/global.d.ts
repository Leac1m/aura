import * as React from 'react';

declare global {
  // Bridge the global JSX namespace to React.JSX (required for React 19 + React Native)
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
  }
}


