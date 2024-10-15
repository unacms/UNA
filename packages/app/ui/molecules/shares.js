import { Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import React, { useCallback, useMemo } from 'react';

const getName = (type, system, object_id, sName) => {
    const aName = [type, system.replace(/_/g, '-'), object_id];
    if (sName) aName.push(sName);  // Упростили проверку на sName
    return aName.join('-');
};

const handleDo = async (url, event) => {
    event.preventDefault();

    try {
        const result = await Share.share({
            message: url,
        });

        switch (result.action) {
            case Share.sharedAction:
                if (result.activityType) {
                    // shared with activity type
                } else {
                    // shared
                }
                break;

            case Share.dismissedAction:
                // dismissed
                break;
        }
    } catch (error) {
        console.log(error.message);
    }
};

export default function ElementShares(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'share');

    const oParams = {...oSettings, ...oProps.params};
    const sIcon = oSettings[oProps['system']]?.icon || "ShareFat";
    const oAction = oProps.action;

    const bShowAction = oParams?.show_action !== false;

    const oButtonProps = {
        variant: oProps.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
    };

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button !== false;
    const bShowActionLabel = oParams?.show_action_label !== false;

    let sTitle = oAction?.title || t('Share');
    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    const handlePress = useCallback((event) => handleDo(oAction.url, event), [oAction.url]);

    const sObject = useMemo(() => getName(oProps.type, oProps.system, oProps.object_id), [oProps.type, oProps.system, oProps.object_id]);

    return (
        <View className="flex-auto flex-row items-center">
            {bShowAction && <View key={sObject + '-action'} className={'flex-auto'}><ButtonAction key="action" startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={handlePress} {...oButtonProps} /></View>}
        </View>
    );
 }
