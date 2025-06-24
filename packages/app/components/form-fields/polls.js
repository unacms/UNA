import Field, { getValidationRules } from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { fetcher } from 'app/lib/fetcher';
import { Button, Modal } from "app/design/controls";
import { useState, useEffect, useCallback, useContext } from 'react';
import Form from 'app/components/elements/form';
import useFetchForm from 'app/lib/hooks/fetch'
import emitter from 'app/context/emitter';
import { PollItem } from 'app/components/elements/entity_poll';
import { View } from 'app/design/view'

export default function FormFieldPolls(props) {
    const name = props.name;
    const [isModal, setIsModal] = useState(false);
    const [pollSource, setPollSource] = useState(props.values || []);
    const [dataForm, setDataForm] = useState(false);
    const defaultValue = props.value ? props.value : '';
    const rules = getValidationRules(props);
    const { field } = useController({ name, rules, defaultValue });
    const { data: dynamicData, error } = useFetchForm(props.request_submit, dataForm);

    console.log("props.value", props.value)

    
    useEffect(() => {
        if (dynamicData?.data?.id) {
            const a = field.value.split(',');
            
            a.push(dynamicData.data.id);
            field.onChange([...new Set(a.filter(Boolean))].join(','));
            setIsModal(false);

            setPollSource((prevPollSource) => ([
                ...prevPollSource,
                dynamicData.data.item
            ]))
        }

    }, [dynamicData]);

    useEffect(() => {
        const subscription = emitter.addListener(`fld_polls_${name}`, (data) => {
            if (data.action == 'add') {
                showSelect()
            }

        })

        return () => {
            subscription.remove()
        }
    }, [])

    const formContext = useFormContext();

    const showSelect = async () => {
        const sResponse = await fetcher(props.request_get);
        setIsModal(sResponse.data[0])
    }

    const onFormSubmit = useCallback((formData, d) => {
        setDataForm(formData);
    }, []);

    async function deletePoll(url, poll) {
        await fetcher(url + '&params[]=' + poll.id);
        setPollSource((prevPollSource) =>
            prevPollSource.filter(item => item.id !== poll.id)
        );
    }

    const frmData = dynamicData?.data[0] || isModal;
    console.log("frmDatafrmData", frmData)
    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Modal
                title={'Create a poll'}
                onVisible={!!isModal}
                transparent={true}
                headerBorder={true}
                scrollable={true}
                onClose={() => { setIsModal(false) }}
            >
                {!!isModal && <Form {...frmData} onFormSubmit={onFormSubmit} resetOnSubmit={false} />}
            </Modal>
            {pollSource && pollSource.map((item, index) => {
                return <View className='mt-4'><PollItem results_url='/api.php?r=bx_timeline/get_block_poll_results'  disabled = {true} onDelete={() => { deletePoll(props.request_remove, item) }} key={"att" + index} data={item} showTitle={true} /></View>
            })}
             {!props.hide_button && <PollButton field_name = {name} />}
        </Field>
    );
}

export function PollButton({ field_name, size = 'base', variant = 'secondary', icon = "Vote" }) {
    return (
        <Button
            startDecorator={icon}
            size={size}
            variant={variant}
            rounded
            onPress={() => emitter.emit(`fld_polls_${field_name}`, { action: 'add' })}
        />
    );
}

