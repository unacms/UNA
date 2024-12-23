import { ScrollView, View } from 'app/design/view';
import { getPageWidth } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { Platform } from 'react-native'
import { BlockByName } from 'app/components/block';

export default function PageLayout(props) {
    return  <BlockByName data={props.data} name={props.blocks.main} />
}
