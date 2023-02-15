export function fetcher (url, token, data) {
    return fetch(process.env.NEXT_PUBLIC_UNA_URL + url, {
        method: data ? 'post' : 'get',
        body: data ? data : null,
        headers:{
            Authorization: 'Bearer ' + token
        }
    }).then(r => r.json()).catch((error) => {
        console.log("Api call error: " + error.message);
    });
}