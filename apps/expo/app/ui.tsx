import UI from 'app/ui/molecules/ui'
import { Stack } from 'expo-router'

export default function UIScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'UI Gallery' }} />
      <UI />
    </>
  )
}

