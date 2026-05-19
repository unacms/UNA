'use client'
import dynamic from 'next/dynamic'
import { Loading } from 'app/customization/loading'

// ssr: false — Root intentionally renders null until useEffect syncs Zustand user from
// page props; SSR would only emit an empty shell. Keeps the app/root chunk client-only
// (code-split) without server-running the full registry tree.
const RootDyn = dynamic(() => import('app/root').then((m) => m.Root), {
    ssr: false,
    loading: () => <Loading />,
})

export default function RootClient(props) {
    return <RootDyn {...props} />
}
