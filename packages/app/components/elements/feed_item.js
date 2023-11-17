import { View } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { linkify2 } from 'app/lib/util'
import Menu from 'app/components/menu';

export default function ElementFeedItem({data}) {
    let tlContent = '';

    tlContent = data.event.content.text;//truncateHTML(data.content.text, 380);
    if (data.event.content.images_attach.length == 0){
        let link = linkify2(data.event.content.text);
        if (link){
            tlContent = tlContent + '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
        }
    }

    return (
    <View className="relative sm:my-0 bg-bgrcard dark:bg-bgrcard-d border-b border-bdr dark:border-bdr-d w-full mx-auto max-w-5xl">             
        <View className="m-4">
            <Html data={tlContent} />
        </View>
        <View className="m-4 flex-row items-center">
            <View className=" flex-row gap-2 flex-auto flex-wrap ">
            <Menu {...data.event.menu_actions} displayType="element" showMatched={true} params={{show_action: true, show_counter: true, show_combined: true}} />
            </View>
        </View>
    </View>
    )
}