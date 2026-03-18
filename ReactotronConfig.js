import Reactotron from "reactotron-react-native";

const tron = Reactotron.configure({
    name: "RideMate",
    host: "localhost", // adb reverse tcp:9090 tcp:9090 tunnels port through USB
})
    .useReactNative()
    .connect();

// Attach to console.tron for global access in DEV
console.tron = tron;