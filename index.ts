// Reactotron MUST be initialized before anything else.
// Using require() prevents the bundler from hoisting it after ES imports.
if (__DEV__) {
  require("./ReactotronConfig");
}

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
