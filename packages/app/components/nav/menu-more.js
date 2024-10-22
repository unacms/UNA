import { View, Pressable, ScrollView } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { menuItemsByName } from 'app/lib/util'
import { appSetting } from 'app/lib/util'
import { MotiView, AnimatePresence } from 'moti'
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform } from 'react-native'
import { useCurrentUser } from 'app/context/user'
import Menu from 'app/components/menu'
import { useState, useContext, useRef, useMemo, memo } from 'react'
import { getImageSizes, FeedbackHaptics, tp, t } from 'app/lib/util'
import { Button, Modal } from 'app/design/controls'

export default function ({ data, oMenuItemsMore, popupVisible, setPopupVisible, defaultButtonProps}) {

    const buttonProps = defaultButtonProps || {
        variant:"outline",
        size:"sm",
        className:" my-auto ",
        startDecorator:"DotsThreeOutline"
    }

    const handleClickMore = (event) => {
        event.preventDefault();
        FeedbackHaptics("Medium");
        setPopupVisible(true);
    };

    return (
        <View className='ml-2'>
            <Button
               {...buttonProps}
                onPress={(event) =>
                    handleClickMore(event)
                }
            />
            <Modal
                key="more-popup"
                onVisible={popupVisible}
                title={data.title}
                onClose={() => {
                    setPopupVisible(false);
                }}
            >
                <View className='p-4 sm:p-0'>
                    <Menu
                        displayType="mixed"
                        {...oMenuItemsMore}
                    />
                </View>
            </Modal>
        </View>
    );
}