import useKeyboard from "./hooks/useKeyboard";
import Services from "./services/history";
import {View} from "app/design/view";
import Form from "../form";
import { useSendData } from "./hooks/useHistory";
import { useEffect, useState, memo } from 'react';

export const SendForm = memo(({ convoId, menuItem, onSubmit, payload }) => {
    const [formData, setFormData] = useState(),
        { sendMessage } = useSendData(convoId, menuItem),
        keyboardHeight = useKeyboard(),
        { profile } = payload || {};

    useEffect(() => {
        (async() => {
            await Services.getForm().catch((e) => { console.log(e.toString()) }).then((data) => {
                if (profile && data?.inputs)
                    data.inputs.payload.value = JSON.stringify({ participants: [profile.id] });

                setFormData(data);
            });
        })();
    }, []);


    useEffect(() => {
        if (formData && formData.inputs?.payload?.value?.length) {
            const oFormData = { ...formData };
            oFormData.inputs.payload.value = '';
            setFormData(oFormData);
        }


    }, [payload]);

    return formData &&  <View style={{ paddingBottom: keyboardHeight }}>
        <Form data={ formData } name={'bx_messenger'}
              classContainerName="flex-row flex-wrap px-2 w-full"
              onFormSubmit={ (oFormData, oData) => {
                  return sendMessage({ oFormData, oData }, {
                      onSuccess: ( data )=> onSubmit(data)
                  })
              }} />
    </View>
});