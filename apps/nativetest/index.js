import { registerRootComponent } from 'expo'
import App from './src/App'

// Don't import global.css here - it causes full reload instead of hot reload
// Import it in App.tsx instead

registerRootComponent(App)







