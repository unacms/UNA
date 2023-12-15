import { useState } from 'react';
import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { View, Row } from 'app/design/view'
import { Button, ButtonMenuActionDefault, ButtonMenuActionText } from 'app/design/controls';
import { Modal } from 'app/design/controls'
import { BlockByData } from 'app/components/block';
import { useTranslation } from 'react-i18next';

export default function ElementConnections(oProps) {
    const [ elementData, setElementData ] = useState(false);
    const [ modalContent, setModalContent ] = useState(false);
    const { t } = useTranslation();

    const oParams = {...appSetting('social_actions', 'connection'), ...oProps.params};

    const bShowActionAsButton = oParams?.show_action_as_button == undefined || oParams.show_action_as_button === true;

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

    const isElementVar = (sName) => {
        return elementData && elementData[sName] != undefined;
    };

    const getElementVar = (sName) => {
        return elementData[sName];
    };

    const setElementVars = (mValue) => {
        if(!elementData)
            setElementData(mValue);
        else
            setElementData({...elementData, ...mValue});
    };

    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {o:oProps.o, iid:oProps.iid, cid:oProps.cid};

        aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;
        const sRequest = '/api.php?r=system/' + sAction + '/TemplServiceConnections&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, sAction) => {
        event.preventDefault();

        if(oProps.params?.on_do && typeof oProps.params.on_do === 'function')
            oProps.params.on_do(sAction);

        performAction('perform', {a:sAction}, (oData) => {
            if(oData.a == 'questionnaire') {
                setModalContent({content: oData.data, designbox_id: 0});
            }
            else
                setElementVars(oData);

            if(oProps.params?.on_done && typeof oProps.params.on_done === 'function')
                oProps.params.on_done(sAction, oData);
        });
    };

    const handleCloseModal = () => {
        setModalContent(false);
    };

    let sAction = oProps?.a || '';
    if(isElementVar('a'))
        sAction = getElementVar('a');

    let sTitle = oProps?.title || '';
    if(isElementVar('title'))
        sTitle = getElementVar('title');

    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText;

    return (
        <>
            <ButtonAction title={sTitle} onPress={(event) => handleDo(event, sAction)} {...oButtonProps} />
            {modalContent && <Modal title={t("Questionnaire")} onVisible={modalContent} outerClickClose={false} onClose={() => handleCloseModal()}>
                <View className='px-4'>
                    <BlockByData /*onFormEmpty = {() => handleUpdate()}*/ block = {modalContent}  />
                </View>
            </Modal>}
        </>
    );
}