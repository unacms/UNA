import React, { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import { Text } from 'dripsy'
import { useRoute } from '@react-navigation/native';

export default function Aaa (props) {
	console.log(999);
	
  const [pageData, setPageData] = useState(undefined)
  const router = useRoute()
  const path = router?.path;
console.log(555);
  useEffect(() => {
	  console.log(666);
    (async () => {
		console.log(777);
      const d = await getData(path);
	  
      if (d?.props?.data) {
        setPageData (d?.props?.data)
      }
    })();
  }, [path]);
  console.log(444);
    console.log(pageData);
  // TODO: handle error when API is down
  if (undefined === pageData)
    return <Text sx={{ textAlign: 'center', mb: 16, fontWeight: 'bold' }}>Loading...</Text>

  return <All path={path} data={pageData} {...props}>{props.children}</All>
}
