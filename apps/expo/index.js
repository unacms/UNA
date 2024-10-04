// registerRootComponent happens in "expo-router/entry"
//import {enableLatestRenderer} from 'react-native-maps';
//enableLatestRenderer();

import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'react-native';
//import 'expo-router/entry';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
//import { appSetting } from 'app/lib/util'
import { memo, useState, useEffect, useContext, useMemo } from 'react'
import InitialScreen from './initial_screen'
import Constants from 'expo-constants';
import { View } from 'react-native';

if (__DEV__) {
	import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

SplashScreen.preventAutoHideAsync();

// Must be exported or Fast Refresh won't update the context
export function App() {
	const customScreenDelay = Constants.manifest.splash.timeout

	const [showSplashScreen, setShowSplashScreen] = useState(customScreenDelay > 0);
	useEffect(() => {
		const prepareApp = async () => {
			if (customScreenDelay) {
				await SplashScreen.hideAsync();
				setTimeout(() => {
					setShowSplashScreen(false);
				}, 3000);
			}
		};
		prepareApp();
	}, []);

	const ctx = useMemo(() => require.context('./app'), []);

	const expoRootComponent = useMemo(() => <ExpoRoot context={ctx} />, [ctx]);

	return <GestureHandlerRootView style={{ flex: 1 }}>

		{expoRootComponent}
		{showSplashScreen && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}><InitialScreen /></View>}
	</GestureHandlerRootView>;
}

registerRootComponent(App);