
import { useUpdateCenterHeader } from 'app/lib/native-handlers';
import { useNavigation, useRouter } from "expo-router";
import { useTheme } from '@react-navigation/native';
import { View, Pressable, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { FeedbackHaptics } from 'app/lib/util';
import { useEffect } from 'react';

export function Nav2({ text, onPress, backButton, addButtons }) {
    const navigation = useNavigation();
    const updateCenterHeader = useUpdateCenterHeader(navigation);
    const { colors } = useTheme();
    let header = <Row className='overflow-hidden items-center w-full'>
        {backButton && <Pressable className="rounded-full mr-2 justify-center items-center" onPress={() => { FeedbackHaptics('Medium'); onPress() }}>
            <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} /></Pressable>
        }
        <Text numberOfLines={1} className={(backButton ? " text-lg " : " text-3xl ") + "font-bold text-neutral-800 dark:text-neutral-200 tracking-tighter"}>{text}</Text>
    </Row>
    useEffect(() => {

        const timer = setTimeout(() => {
            updateCenterHeader(null, header, false, backButton ? null : addButtons);
        }, 100);

        return () => clearTimeout(timer);
    }, [header, backButton, addButtons]);

}