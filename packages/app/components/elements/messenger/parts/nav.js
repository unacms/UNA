import { Platform } from 'react-native'
import { updateRightHeaderObj, updateCenterHeader } from 'app/lib/native-handlers';
import { useNavigation, useRouter } from "expo-router";
import { useTheme } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { View, Pressable, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { FeedbackHaptics } from 'app/lib/util';
export function Nav({ addButtons }) {

    const navigation = useNavigation();
    setTimeout(() => {
        updateRightHeaderObj(addButtons, navigation);
    }, 300);

    return <></>
}

export function Nav2({ text, onPress, backButton }) {
    const routerExpo = useRouter();
    const navigation = useNavigation();
    const { colors } = useTheme();
    let header = <Row className='w-auto w-full items-center '>
        {backButton && <Pressable className="mr-4   rounded-full justify-center items-center" onPress={() => { FeedbackHaptics('Medium'); onPress() }}>
            <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} /></Pressable>
}
        <Text className="font-bold  ml-2 text-neutral-800 dark:text-neutral-200 text-xl">{text}</Text>
    </Row>
    updateCenterHeader(null, header, false, navigation, routerExpo, colors, null);
}