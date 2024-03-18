import {BlockByName} from 'app/components/block';
import {ClearNotif} from 'app/ui/workers/notif_checker';
export default function PageLayout(props) {
    return (  <><ClearNotif/><BlockByName data={props.data} name={props.blocks.browse} /></>)
}
