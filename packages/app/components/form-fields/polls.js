import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';
import { ScrollView, View } from 'app/design/view'
import Embed from 'app/ui/molecules/embed'
import { Button, Modal } from "app/design/controls";
import { useState, useEffect, useCallback, useContext } from 'react';
import Form from 'app/components/elements/form';
import useFetchForm from 'app/lib/hooks/fetch'
export default function FormFieldText(props) {
    const variant = props.variant || 'secondary';
    const size = props.size || 'base';
    const name = props.name;
    const [isModal, setIsModal] = useState(false);
    const [dataForm, setDataForm] = useState(false);
    const { data: dynamicData, error } = useFetchForm(props.form_submit, dataForm);

    console.log("dynamicData", dynamicData)

    const defaultValue = props.value ? props.value : '';
    const rules = getValidationRules(props);

    const formContext = useFormContext();

    const { field } = useController({ name, rules, defaultValue });

    console.log('propsprops', props);

    const showSelect = async () => {
        const sResponse = await fetcher(props.form_get);
        setIsModal(sResponse.data[0])

        
    }


    const onFormSubmit = useCallback((formData, d) => {

        setDataForm(formData);
    }, []);

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Modal
                title={'Add poll'}
                onVisible={!!isModal}
                transparent={true}
                headerBorder={true}
                scrollable={true}
                onClose={() => { setIsModal(false) }}
            >
                {!!isModal && <Form {...isModal} onFormSubmit={onFormSubmit}  resetOnSubmit={true} />}
            </Modal>
            <Button
                startDecorator="Vote"
                variant={variant}
                size={size}
                rounded
                onPress={() => showSelect()}
            />
        </Field>
    );
}
