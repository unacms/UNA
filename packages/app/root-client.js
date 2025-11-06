'use client'                     
import dynamic from 'next/dynamic'
import { Loading } from 'app/loading'

const RootDyn = dynamic(() => import('app/root').then(m => m.Root), {
  ssr: false,
  loading: () => <Loading />,
})
export default function RootClient(props) {
    console.log("RootClient", props.data.ts, props.data.uri)
    return (
        <>
          
          <RootDyn {...props} />
        </>
      )
}