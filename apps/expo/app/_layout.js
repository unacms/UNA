import { Provider } from 'app/provider'
import { Stack,Tabs } from 'expo-router'

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
      } ><Stack.Screen name="post" options={{title:'Postss'}}></Stack.Screen><Stack.Screen name="profile" options={{title:'Postss222'}}/><Stack.Screen name="contact" options={{title:'contactz'}}/></Stack>
         
    </Provider>

  )
}
