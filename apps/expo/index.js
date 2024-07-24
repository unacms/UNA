// registerRootComponent happens in "expo-router/entry"
//import {enableLatestRenderer} from 'react-native-maps';
//enableLatestRenderer();

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'react-native';
//import 'expo-router/entry';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Must be exported or Fast Refresh won't update the context
export function App() {
	const ctx = require.context("./app");
	return  <GestureHandlerRootView style={{ flex: 1 }}><ExpoRoot context={ctx} /></GestureHandlerRootView>;
}

registerRootComponent(App);