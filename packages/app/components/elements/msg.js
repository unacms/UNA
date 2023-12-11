import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementMsg({data, msg_type}) {
    console.log(msg_type);
    if (!data.length)
        return null;

    let clsname = "p-4 bg-yellow-100/80 dark:bg-yellow-900/80 border dark:border-yellow-800 border-yellow-300 p-3 rounded-lg mb-4";
    let clsname1 = "text-black dark:text-white text-center";
    if (msg_type == 'caption'){
        clsname = "mb-4";
        clsname1 = "text-black dark:text-white text-base";
    }

    return (
        <View className={clsname}>
            <Text className={clsname1}>{data}</Text>
        </View>
    );
}
