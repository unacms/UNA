import { ScrollView } from 'app/design/view';
import { StaticBlock} from 'app/components/block';
import { appSetting, getPageWidth } from 'app/lib/util'

export default function PageLayout(props) {

    return (<ScrollView className={ getPageWidth(props.uri) + ' sm:my-4 mx-auto w-full '}>
            {props.children}
        </ScrollView>)
}
