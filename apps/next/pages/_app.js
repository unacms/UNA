import 'raf/polyfill'
import { Analytics } from '@vercel/analytics/react'

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

import '../../../packages/app/styles/global.css'

function MyApp({ Component, pageProps }) {

  return (
    <>
        <Provider>
          <CurrentUserProvider>
            <Component {...pageProps} />
            <Analytics />
          </CurrentUserProvider>
        </Provider>
      
    </>
  )
}

export default MyApp
