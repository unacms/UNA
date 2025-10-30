import { registerRootComponent } from 'expo'
import { View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Скрываем splash screen сразу
SplashScreen.preventAutoHideAsync();

export function App() {
	useEffect(() => {
		// Скрываем splash screen после монтирования
		SplashScreen.hideAsync().catch(() => {});
	}, []);
	const scheme = useColorScheme();

	// Пробуем создать контекст безопасно
	let ctx;
	try {
		// Для новой архитектуры используем прямой импорт
		ctx = require.context('./app');
	} catch (error) {
		console.error('Error loading app context:', error);
		// Fallback: используем expo-router/entry напрямую
		return null;
	}

	
	return <View><Text>Hello11</Text>{ctx ? <ExpoRoot context={ctx} /> : null}</View>
}

registerRootComponent(App);