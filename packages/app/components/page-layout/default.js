import { ScrollView } from 'app/design/view';
import { StaticBlock} from 'app/components/block';
import { appSetting } from 'app/lib/util'

export default function PageLayout(props) {
    return (<ScrollView className={ appSetting('layout', 'max_width') + ' sm:my-4 mx-auto w-full '}>
        <StaticBlock name={props.path}  />
            {props.children}
        </ScrollView>)
}
