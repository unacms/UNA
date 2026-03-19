import { useState, useMemo, useCallback, useEffect } from 'react';
import { appSetting, getAlert } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { Modal } from 'app/design/controls'
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { useTranslation } from 'react-i18next';
import { useLayoutData } from 'app/context/layout'
import { storageClear } from 'app/lib/util'
import { getComponent } from 'app/components/registry'

const getKey = (sO, iIid, iCid) => {
    return sO + '_' + iIid + '_' + iCid;
}

export default function ElementConnections({
    iid: item_id, 
    cid: content_id, 
    o: object, 
    params: initial_params, 
    primary = false, 
    mode,
 
    name,
    actions, 
    title = '', 
}) {

    const DropdownMenuItem = getComponent('menu-item', 'dropdown');
    const [elementData, setElementData] = useState({name, actions, title});
    const [modalContent, setModalContent] = useState(false);
    //const { layoutData, setLayoutData } = useLayoutData()
    const { t } = useTranslation();

    console.log('elementData', name);
    const settings = appSetting('social_actions', 'connection_ext');
    const params = { ...settings, initial_params };

    const keyName = useMemo(() => getKey(object, item_id, content_id), [object, item_id, content_id]);

    const icons = object && settings[object]?.icons != undefined ? settings[object].icons : {
        add: 'UserPlus',
        remove: 'UserX',
        hz: 'UserPlus'
    };

    const bShowActionAsButton = params?.show_action_as_button == undefined || params.show_action_as_button === true;

    const buttonProps = {
        variant: primary ? 'primary' : initial_params?.button_variant,
        size: initial_params?.button_size,
        rounded: initial_params?.button_rounded,
        fullWidth: initial_params?.button_full_width,
        showTitleFromSize: initial_params?.button_show_title_from_size,
        hide_icon: initial_params?.hide_icon,
        padding: initial_params?.padding,
        ring: initial_params?.button_ring
    };

   /* useEffect(() => {
        if (layoutData && layoutData?.type == 'сonnections:action' && layoutData?.data.key == keyName) {
            _handleOnDo(layoutData.data.data)
        }
    }, [layoutData?.data?.time]);*/


    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if (!!icons[elementData.name] && buttonProps.hide_icon !== true)
        buttonProps.startDecorator = icons[elementData.name];



    console.log("buttonProps", buttonProps, name, icons,);

    const _handleRequset = async (action, event) => {
        const paramsDefault = { o: object, iid: item_id, cid: content_id, a: action, r: 'object' };
        const sRequest = '/api.php?r=system/perform/TemplServiceConnections&params[]=' + JSON.stringify(paramsDefault);
    
        const oResponse = await fetcher(sRequest);
        console.log("oResponse", oResponse);
       // setLayoutData(getAlert('сonnections:action', { object: sO, time: Date.now(), action: aParams, data: oResponse?.data, key: sKey, reload: isReload }));
        alert(555)
    }
    const _handleCloseModal = () => {
        setModalContent(false);
    }
    if (mode == 'dropdown-menu') {
        return <>
            <DropdownMenuItem
                item={{
                    title: elementData.title,
                    icon: icons[elementData.name]
                }}
                icon={icons[elementData.name]}
                handleSelect={(event) => { _handleRequset(elementData.name, event) }}
            /></>;
    }
    else {

        return (
            <>
                <ButtonAction title={elementData.title} onPress={(event) => _handleRequset(elementData.name, event)} {...buttonProps} />
                {modalContent && <Modal title={t("Questionnaire")} onVisible={modalContent} onClose={_handleCloseModal}>
                    <View className='px-4'>
                        <BlockByData onFormEmpty={_handleFormSubmittedAndValid} block={modalContent} />
                    </View>
                </Modal>}
            </>
        );
    }
}