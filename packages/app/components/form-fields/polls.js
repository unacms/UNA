import Field, { getValidationRules } from './_field';
import { fetcher } from 'app/lib/fetcher';
import { Button, Modal } from "app/design/controls";
import { useState, useEffect, useCallback } from 'react';
import Form from 'app/components/elements/form';
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import emitter, { EVENTS } from 'app/context/emitter';
import { PollItem } from 'app/components/elements/entity-poll';
import { useFormField } from 'app/lib/form/use-form-field';
import { useTranslation } from 'react-i18next';

export default function FormFieldPolls(props) {
    const { t } = useTranslation();
    const name = props.name;
    const [isModal, setIsModal] = useState(false);
    const [pollSource, setPollSource] = useState(props.values || []);
    const [dataForm, setDataForm] = useState(false);
    const { field } = useFormField(props, {
        rules: getValidationRules(props),
        syncValue: false,
    });
    const { data: dynamicData } = useFetchForm(props.request_submit, dataForm);

    useEffect(() => {
        if (dynamicData?.data?.id) {
            const a = String(field.value || '').split(',');

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
        const subscription = emitter.addListener(EVENTS.fieldPolls(name), (data) => {
            if (data.action == 'add') {
                showSelect()
            }

        })

        return () => {
            subscription.remove()
        }
    }, [])

    const showSelect = async () => {
        const sResponse = await fetcher(props.request_get);
        setIsModal(sResponse.data[0])
    }

    const onFormSubmit = useCallback((formData) => {
        setDataForm(formData);
    }, []);

    async function deletePoll(url, poll) {
        await fetcher(url + '&params[]=' + poll.id);
        setPollSource((prevPollSource) =>
            prevPollSource.filter(item => item.id !== poll.id)
        );
    }

    const frmData = dynamicData?.data[0] || isModal;
    return (
        <Field {...props}>
            <Modal
                title={t('Create a poll')}
                onVisible={!!isModal}
                transparent={true}
                headerBorder={true}
                scrollable={true}
                onClose={() => { setIsModal(false) }}
            >
                {!!isModal && <Form {...frmData} onFormSubmit={onFormSubmit} resetOnSubmit={false} />}
            </Modal>
            {pollSource && pollSource.map((item, index) => {
                return <PollItem results_url='/api.php?r=bx_timeline/get_block_poll_results'  disabled = {true} onDelete={() => { deletePoll(props.request_remove, item) }} key={"att" + index} data={item} showTitle={true} />
            })}
             {!props.hide_button && <Button
                className="mt-4"
                title={t('Add Poll')}
                onPress={() => {
                    emitter.emit(EVENTS.fieldPolls(name), { action: 'add' });
                }}
            />}
        </Field>
    );
}
