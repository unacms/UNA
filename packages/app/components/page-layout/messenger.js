import { BlockDataByName } from 'app/lib/util'
import Messenger from 'app/components/elements/messenger';

export default function PageLayout(props) {
    const data = BlockDataByName(props.data, 'bx_messenger:get_main_messenger_page')
    return  <Messenger data = {data.content[0].data} url={props.url} />
}
