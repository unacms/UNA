import { ScrollView } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'

export default function PageLayout(props) {

    return (<ScrollView className={ getPageWidth(props.uri) + ' sm:my-4 mx-auto w-full '}>
            {props.children}
            {appStatic('components_fullfooter', '')}
        </ScrollView>)
}
