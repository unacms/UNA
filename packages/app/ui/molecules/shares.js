import { Share } from 'react-native';
import { useTranslation } from 'react-i18next';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';

export default function ElementShares(oProps) {
    const { t } = useTranslation();
    const oSettings = appSetting('social_actions', 'share');

    const oParams = {...oSettings, ...oProps.params};
    const sIcon = oSettings[oProps['system']]?.icon ? oSettings[oProps['system']].icon : "ShareFat"
    const oAction = oProps.action;

    const sDisplaySize = oProps?.displaySize ? oProps.displaySize : (oParams?.display_size ? oParams.display_size : false);

    const bShowAction = (oParams?.show_action == undefined || oParams.show_action === true);

    let oButtonProps = {};
    if(oProps.primary)
        oButtonProps.variant = 'primary';
    if(oProps.params?.button_variant != undefined)
        oButtonProps.variant = oProps.params.button_variant;
    if(oProps.params?.button_size != undefined)
        oButtonProps.size = oProps.params.button_size;
    if(oProps.params?.button_rounded != undefined)
        oButtonProps.rounded = oProps.params.button_rounded;
    if(oProps.params?.button_full_width != undefined)
        oButtonProps.fullWidth = oProps.params.button_full_width;

    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const handleDo = async (event) => {
        event.preventDefault();

        try {
            const result = await Share.share({
                message: oAction.url,
            });

            switch(result.action) {
                case Share.sharedAction:
                    if (result.activityType) {
                        // shared with activity type of result.activityType
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

    //--- show action
    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;
    const bShowActionLabel = oParams?.show_action_label == undefined || oParams.show_action_label === true;

    let sTitle = oAction?.title || t('Share');
    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    let sActionButton = (
        <ButtonAction key="action" size={sDisplaySize} startDecorator={sIcon} title={bShowActionLabel ? sTitle : false} onPress={(event) => {handleDo(event)}} {...oButtonProps} />
    );

    const sObject = getName();
    return (
        <View className="flex-auto flex-row items-center">
            {bShowAction && <View key={sObject + '-action'} className={'flex-auto'}>{sActionButton}</View>}
        </View>
    );
 }
