import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementMsg({data, msg_type}) {
    if (!data.length)
        return null;

    let clsname = "p-4 bg-yellow-100/80 dark:bg-yellow-900/80 border dark:border-yellow-800 border-yellow-300 p-3 rounded-lg mb-4";
    let clsname1 = "text-black dark:text-white text-center";
    if (msg_type == 'caption'){
        clsname = "mb-4";
        clsname1 = "text-black dark:text-white text-base";
    }

    if (msg_type == 'result'){
        clsname = "";
        clsname1 = "text-black dark:text-white text-base text-center";
    }

    if (msg_type == 'info'){
        clsname = "px-4 py-2 sm:px-6 sm:py-4 mb-4  rounded-none lg:rounded-2xl sm:border border-bdrcard dark:border-bdrcard-d backgrop-blur groupweb:duration-200 overflow-hidden rounded-2xl  bg-card sm:hover:bg-bgrcard-h sm:dark:hover:bg-bgrcard-dh mx-4";
        clsname1 = "text-black dark:text-white text-base text-center";
    }

    return (
        <View className={clsname}>
            <Text className={clsname1}>{data}</Text>
        </View>
    );
}
