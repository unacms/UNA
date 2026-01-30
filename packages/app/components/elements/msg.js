import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementMsg({ data, msg_type, blockWrapperProps }) {
    if (!data.length)
        return null;

    let clsname = "bg-accent p-3 rounded-xl";
    let clsname1 = "text-accent-foreground text-center";
    if (msg_type == 'caption') {
        clsname = " ";
        clsname1 = "text-card-foreground";
    }

    if (msg_type == 'result') {
        clsname = "";
        clsname1 = "text-card-foreground text-center";
    }

    if (msg_type == 'info') {
        clsname = "px-4 py-2 sm:px-6 sm:py-4 mb-4  rounded-none lg:rounded-2xl sm:border border-bdrcard dark:border-bdrcard-d backgrop-blur web:group web:duration-200 overflow-hidden rounded-2xl  bg-card web:sm:hover:bg-bgrcard-h web:sm:dark:hover:bg-bgrcard-dh mx-4";
        clsname1 = "text-card-foreground text-center";
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className={clsname}>
                <Text className={clsname1}>{data}</Text>
            </View>
        </BlockWrapper>
    );
}
