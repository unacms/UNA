// registerRootComponent happens in "expo-router/entry"
//import {enableLatestRenderer} from 'react-native-maps';
//enableLatestRenderer();


import { configureReanimatedLogger } from 'react-native-reanimated';
configureReanimatedLogger({ strict: false });

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { StatusBar, Platform } from 'react-native';
//import 'expo-router/entry';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { useState, useEffect, useMemo } from 'react'
import InitialScreen from './initial_screen'
import Constants from 'expo-constants';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// Must be exported or Fast Refresh won't update the context
export function App() {
	// Update to use Constants.expoConfig which is the newer pattern
	// and add a safe fallback for the splash timeout
	const customScreenDelay = Constants.expoConfig?.splash?.timeout || 0;

	const [showSplashScreen, setShowSplashScreen] = useState(customScreenDelay > 0);
	/*useEffect(() => {
		const prepareApp = async () => {

				await SplashScreen.hideAsync();
				setTimeout(() => {
					setShowSplashScreen(false);
				}, customScreenDelay);

		};
		prepareApp();
	}, []);*/

	const ctx = useMemo(() => require.context('./app'), []);

	const expoRootComponent = useMemo(() => <ExpoRoot context={ctx} />, [ctx]);
	//verifyInstallation();
	const scheme = useColorScheme();
	// Use theme colors that match settings-default.js
	const backgroundColor = scheme === 'dark' ? 'rgba(24,24,27,1)' : 'rgba(255,255,255,1)';
	
	return (
		<SafeAreaProvider>
			<KeyboardProvider>
				<GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
					{expoRootComponent}
					{showSplashScreen && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}><InitialScreen /></View>}
				</GestureHandlerRootView>
			</KeyboardProvider>
		</SafeAreaProvider>
	);
}

registerRootComponent(App);