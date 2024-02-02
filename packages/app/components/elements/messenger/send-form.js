import useKeyboard from "./hooks/useKeyboard";
import { HistoryServices as Services } from "app/components/elements/messenger/services";
import {View} from "app/design/view";
import Form from "app/components/elements/form";
import { useSendData } from "./hooks/useHistory";
import { useEffect, useState, memo } from 'react';

export const SendForm = memo(({ onSubmit }) => {
    const [formData, setFormData] = useState(),
          { sendMessage } = useSendData(),
          keyboardHeight = useKeyboard();

    useEffect(() => {
        (async() => await Services
            .getForm()
            .catch((e) => {
                        console.log(e.toString())
                    })
            .then((data) => setFormData(data)))
        ();
    }, []);

    return formData && <View style={{ paddingBottom: keyboardHeight }}>
                            <Form data={ formData } name={'bx_messenger'} resetOnSubmit={true} classContainerName="flex-row flex-wrap px-2 w-full"
                                  onFormSubmit={ (oFormData, oData) => {
                                      return sendMessage({ oFormData, oData }, {
                                          onSuccess: ( data )=> {
                                              onSubmit(data);
                                          }
                                      })
                                  }} />
                       </View>
});