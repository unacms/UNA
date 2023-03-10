import React, { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { Text } from 'dripsy'
import { useRoute } from '@react-navigation/native';
import { Stack } from 'expo-router'
import { View } from 'app/design/view'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Root (props) {
  const [pageData, setPageData] = useState(undefined)
  const router = useRoute()
  const path = router?.path;

  useEffect(() => {
    (async () => {
      const d = await getData(path);
      if (d?.props) {
        setPageData (d?.props)
      }
    })();
  }, [path]);

  // TODO: handle error when API is down
  if (undefined === pageData)
    return <Text sx={{ textAlign: 'center', mb: 16, fontWeight: 'bold' }}><Stack.Screen options={{ title: "..." }} />Loading...</Text>

  return <View style={{flex:1}}><Stack.Screen options={{ title: pageData.data.title }} /><All path={path} {...pageData} {...props}>{props.children}</All></View>
}
