"use client"

import { Root } from 'app/root'
import 'raf/polyfill'
import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
//import PageCustomHome from 'app/components/page-layout/home';
import Layout from 'app/components/layout';
import { appSetting } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static';
import JitSi from 'app/ui/molecules/jitsi'

const fixReanimatedIssue = () => {
  // FIXME remove this once this reanimated fix gets released
  // https://github.com/software-mansion/react-native-reanimated/issues/3355
  if (process.browser) {
    // @ts-ignore
    window._frameTimestamp = null
  }
}
fixReanimatedIssue()

import { Provider } from 'app/provider'
import { CurrentUserProvider } from 'app/context/user';

import 'app/styles/global.css'

export  function Page (props) {
  const queryClient = new QueryClient()

  let layoutCustomKey = appSetting('layouts', 'home')
  let layoutKey = '';
  let layoutBlocks = '';
  if (!layoutCustomKey){
      if (isWeb)
          layoutKey = props.data.layout;
  }
  else{
      layoutKey = layoutCustomKey.layout;
      layoutBlocks = layoutCustomKey.blocks
  }

   function StaticBlock(props) {
    let block = {designbox_id:0, id: props.name};

    return (
        <> 
            {appStatic('components_' + props.name.replace('static:', ''))}
        </>
    );

}

  return (
    <>
        <Provider>
          <QueryClientProvider client={queryClient}>
            <CurrentUserProvider>
              {!!process.env['VERCEL'] ? <Analytics /> : null}
              <Layout path={props?.path} data={props.data} uri={props?.uri}>
                <JitSi roomName={'dash_room'} />
              </Layout>
            </CurrentUserProvider>
          </QueryClientProvider>
        </Provider>
      
    </>
  )
}

