import { useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { Button } from 'app/design/controls';

export default function ElementConnections(oProps) {
    const [ elementData, setElementData ] = useState(false);

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

        performAction('perform', {a:sAction}, (oData) => {
            setElementVars(oData);
        });
    };

    let sAction = oProps?.a || '';
    if(isElementVar('a'))
        sAction = getElementVar('a');

    let sTitle = oProps?.title || '';
    if(isElementVar('title'))
        sTitle = getElementVar('title');

    let oButtonProps = {
        variant: oProps.primary ? 'primary' : 'default',
        title: sTitle,
        fullWidth: true,
    };

    return (
        <Button {...oButtonProps} onPress={(event) => handleDo(event, sAction)} />
    );
}