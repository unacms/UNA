import { Provider } from 'app/provider'
import { Stack } from 'expo-router'

export default function Root() {
  return (
    <Provider>
      <Stack screenOptions={
        { // https://reactnavigation.org/docs/native-stack-navigator/#options        
          headerStyle: {
            backgroundColor: "#2F5E8E",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          }
        }
      } />
    </Provider>
  )
}
