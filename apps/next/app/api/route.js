import { NextResponse } from 'next/server'
import { env } from 'app/lib/env';
import { cookies } from 'next/headers'

export async function GET(request) {

    const a = new URL(request.url)
    console.log('8888888888888888888888888', a);

    let c = cookies().getAll();
    let cookieString = '';
 
    c.map(function (item) {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
    });
  //  const s = request.url.replace('http://localhost:3000/api', env('UNA_URL') + '/api.php');
    let s = env('UNA_URL') + '/api.php' + a.search
    const res = await fetch(s, {
        headers: {
            authorization: 'Bearer ' + env('UNA_API_KEY'),
            cookie: cookieString
        },
    })
    const data = await res.json()
   // console.log(data,'xxx')
  //  let data = {a:'x'}
    return NextResponse.json(data)
}