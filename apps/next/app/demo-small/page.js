import { cookies } from 'next/headers'
import { env } from 'app/lib/env';

export const runtime = 'edge'

export default async function Path (props) {
    
    return <div>demo page (small)</div>
}
