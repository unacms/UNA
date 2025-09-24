import { useState, useMemo, useCallback, useEffect } from 'react';
import { appSetting, getAlert } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View } from 'app/design/view'
import { ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { Modal } from 'app/design/controls'
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { useTranslation } from 'react-i18next';
import { useLayoutData } from 'app/context/layout'
import { storageClear } from 'app/lib/util'
import DropdownMenuItem from 'app/components/menu-items/dropdown-menu-item'

const getKey = (sO, iIid, iCid) => {
    return sO + '_' + iIid + '_' + iCid;
}

const isElementVar = (elementData, sName) => {
    return elementData?.[sName] != undefined;
};

const getElementVar = (elementData, sName) => {
    return elementData[sName];
};

const setElementVars = (elementData, setElementData, mValue) => {
    if (!elementData)
        setElementData(mValue);
    else
        setElementData({ ...elementData, ...mValue });
};

const performAction = async (setLayoutData, sO, iIid, iCid, sKey, sAction, aParams) => {
    const aParamsDefault = { o: sO, iid: iIid, cid: iCid };

    aParams = aParams ? { ...aParamsDefault, ...aParams } : aParamsDefault;
    const sRequest = '/api.php?r=system/' + sAction + '/TemplServiceConnections&params[]=' + JSON.stringify(aParams);

    const oResponse = await fetcher(sRequest);
    const isReload = oResponse?.data?.a != 'questionnaire';
    if (isReload)
        storageClear();

    setLayoutData(getAlert('сonnections:action', { object: sO, time: Date.now(), action: aParams, data: oResponse?.data, key: sKey, reload: isReload }));
};

const handleDo = (performAction, fOnDo, sAction, oEvent) => {
    if (!!oEvent)
        oEvent.preventDefault();

    if (fOnDo && typeof fOnDo === 'function')
        fOnDo(sAction);

    performAction('perform', { a: sAction });
};

const handleOnDo = (setElementVars, setModalContent, fOnDone, oData) => {
    if (oData?.a == 'questionnaire') {
        setModalContent({ content: oData.data, designbox_id: 0 });
    }
    else {
        setElementVars(oData);
    }

    if (fOnDone && typeof fOnDone === 'function')
        fOnDone(oData);
}

const handleCloseModal = (setModalContent) => {
    setModalContent(false);
};

const handleFormSubmittedAndValid = (handleDo, handleCloseModal) => {
    setTimeout(() => {
        handleCloseModal();
        handleDo('add');
    }, 100);
}

export default function ElementConnections(oProps) {
    const [elementData, setElementData] = useState(false);
    const [modalContent, setModalContent] = useState(false);
    const { layoutData, setLayoutData } = useLayoutData()
    const { t } = useTranslation();

    const oSettings = appSetting('social_actions', 'connection');
    const oParams = { ...oSettings, ...oProps.params };

    const sKey = useMemo(() => getKey(oProps.o, oProps.iid, oProps.cid), [oProps.o, oProps.iid, oProps.cid]);

    const oIcons = oProps?.o && oSettings[oProps.o]?.icons != undefined ? oSettings[oProps.o].icons : {
        add: 'UserCheck',
        remove: 'UserX'
    };

    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;

    const oButtonProps = {
        variant: oProps?.primary ? 'primary' : oProps.params?.button_variant,
        size: oProps.params?.button_size,
        rounded: oProps.params?.button_rounded,
        fullWidth: oProps.params?.button_full_width,
        showTitleFromSize: oProps.params?.button_show_title_from_size,
        hide_icon: oProps.params?.hide_icon,
        padding: oProps.params?.padding,
        ring: oProps.params?.button_ring
    };

    const _isElementVar = useCallback((sName) => isElementVar(elementData, sName), [elementData]);
    const _getElementVar = useCallback((sName) => getElementVar(elementData, sName), [elementData]);
    const _setElementVars = useCallback((mValue) => setElementVars(elementData, setElementData, mValue), [elementData, setElementData]);
    const _performAction = useCallback((sAction, aParams) => performAction(setLayoutData, oProps.o, oProps.iid, oProps.cid, sKey, sAction, aParams), [setLayoutData, oProps.o, oProps.iid, oProps.cid, sKey]);
    const _handleDo = useCallback((sAction, oEvent) => handleDo(_performAction, (oProps.params?.on_do ? oProps.params.on_do : false), sAction, oEvent), [_performAction, oProps.params.on_do]);
    const _handleOnDo = useCallback((oData) => handleOnDo(_setElementVars, setModalContent, (oProps.params?.on_done ? oProps.params.on_done : false), oData), [_setElementVars, setModalContent, oProps.params.on_done]);
    const _handleCloseModal = useCallback(() => handleCloseModal(setModalContent), [setModalContent]);
    const _handleFormSubmittedAndValid = useCallback(() => handleFormSubmittedAndValid(_handleDo, _handleCloseModal), []);

    useEffect(() => {
        if (layoutData && layoutData?.type == 'сonnections:action' && layoutData?.data.key == sKey) {
            _handleOnDo(layoutData.data.data)
        }
    }, [layoutData?.data?.time]);

    let sAction = oProps?.a || '';
    if (_isElementVar('a'))
        sAction = _getElementVar('a');

    let sTitle = oProps?.title || '';
    if (_isElementVar('title'))
        sTitle = _getElementVar('title');


    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;
    if (oIcons && !!oIcons[sAction] && oButtonProps.hide_icon !== true)
        oButtonProps.startDecorator = oIcons[sAction];

    if (oProps.mode == 'dropdown-menu') {
        return <>
            <DropdownMenuItem
              
               
                item={{
                    title: sTitle,
                    icon: oIcons[sAction]
                }}
                icon={oIcons[sAction]}
                handleSelect={(event) => {_handleDo(sAction, event) }}
            /></>;
    }
    else {

        return (
            <>
                <ButtonAction title={sTitle} onPress={(event) => _handleDo(sAction, event)} {...oButtonProps} />
                {modalContent && <Modal title={t("Questionnaire")} onVisible={modalContent} onClose={_handleCloseModal}>
                    <View className='px-4'>
                        <BlockByData onFormEmpty={_handleFormSubmittedAndValid} block={modalContent} />
                    </View>
                </Modal>}
            </>
        );
    }
}