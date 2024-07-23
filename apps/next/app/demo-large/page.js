import { Page } from './content'
import { cache } from 'react'

//export const runtime = 'edge'

const getData = cache(async (props) => {
    return { "status": 200, "module": "system", "method": "get_page_by_request", "params": ["about"], "data": { "id": 2, "title": "About", "uri": "about", "url": "about", "author": 0, "added": 0, "module": "system", "type": 1, "layout": "layout_1_column", "cover_block": "", "menu_top": "", "menu": [], "menu_bottom": "", "menu_add": "", "elements": { "cell_1": [{ "id": 24, "module": "system", "title": "About", "designbox_id": 11, "content": "<div class=\"bx-page-lang-container\"><h1>This site is powered by UNA. The rest is a mystery.<\/h1><p>this is a test<\/p><ol><li>test<\/li><li>testtse<\/li><li>tsetset<\/li><\/ol><h2>sdfsdfsdfs<\/h2><p>sdfsdfsdf<\/p><p>sdfsdf<\/p><\/div>", "menu": "", "source": "" }] }, "user": { "id": 19, "display_name": "John Doe", "url": "\/view-persons-profile\/dr-andrey-yasko-phd", "avatar": "https:\/\/ci.una.io\/test3\/s\/bx_persons_pictures\/dhwkek9ttkhrnyfqk7wecr4cvgjpulzy.jpg", "info": { "id": 19, "account_id": 1, "type": "bx_persons", "content_id": 1, "cfw_value": 2147483617, "cfw_items": 31, "cfu_items": 31, "cfu_locked": 0, "status": "active" }, "notifications": 24, "active": true, "status": "active" } } }
});


export default async function Path(props) {

    const data = await getData(props)
    return <Page path={'home'} data={data.data} uri={data.data.uri} url={data.data.url}>{ }</Page>
}
