import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { View, Row } from 'app/design/view'
import { getComponent } from 'app/components/registry';
import { FeedbackHaptics, storageSet, appSetting, storageGet, storageClear } from 'app/lib/util';
import { Platform } from 'react-native';
import emitter from 'app/context/emitter';
import useDebounce from 'app/lib/hooks/debounce'
import { Button } from 'app/design/controls';
import { isObjectsEqual } from 'app/lib/util'
import useFetchForm from 'app/lib/hooks/fetch'

function getFormType(name) {
    return getComponent('form', String(name))
}

function getFormFieldList(name, inputs, handleSubmit, isInitial = false, lastChangedField, saveOnChanges, formProps) {

    const ElementForm = getFormType(name);

    if ('undefined' !== typeof ElementForm && isInitial) {
        return;
    }

    if (!inputs) {
        return;
    }

    return Object.keys(inputs).map(function (key) {
        return getFormFieldByData(inputs[key], handleSubmit, 'default', { ...formProps, form_name: name, last_changed: lastChangedField, saveOnChanges: saveOnChanges })
    });
}

const checkInputType = (name, form_name, input_name) => {
    const setting = appSetting('forms', name + '_control_names');
    if (setting && (setting.includes(form_name + '_' + input_name) || setting.includes('*_' + input_name)))
        return true;

    return false;
}

export default function ({ layout, data: initedData, name: formName, onFormEmpty, onFormSubmit: onFormSubmitInternal, formProps: initedFormProps, resetOnSubmit, isSubmit, onChange, saveOnChanges, exProps, request }) {
    const isAutoChange = !!onChange;

    const [postData, setPostData] = useState(null);
    const [response, setResponse] = useState(null);

    const [data, setRealData] = useState(initedData);
    const [otherData, setOtherData] = useState(null);

    const requestUrl = request?.url;
    const { data: dynamicData } = useFetchForm(requestUrl, postData);

    // update state when form is submitted
    const onFormSubmit = onFormSubmitInternal ?? ((formData, d) => {
        if (requestUrl) {
            setPostData(formData);
        }
    });

    console.log("refetch");
    useEffect(() => {
        if (dynamicData) {

            const items = Array.isArray(dynamicData.data) ? dynamicData.data : [dynamicData.data];
            if (items?.length > 0) {
                setRealData(prev => {
                    if (!isObjectsEqual(prev, items)) {
                        const formItem = items.find(item => item?.type === 'form')?.data
                            ;

                        if (!formItem) return null; // если нет формы — ничего не меняем

                        return {
                            ...formItem,
                            updated: Date.now(),
                        };
                    }

                    return prev;
                });
                setResponse(items.find(item => item?.type === 'form')?.response)
                setOtherData(prev => {
                    if (!isObjectsEqual(prev, items)) {
                        return items.find(item => item?.type !== 'form')
                    }
                    return prev;
                });
            }

        } else {
            setRealData(initedData);
        }
    }, [dynamicData, initedData]);

    const name = data?.params?.display?.includes('_delete') ? '' : (formName || data?.params?.display)
    const defaultValues = {}

    const { auto_focus, ...formProps } = initedFormProps ?? {};
    // 1. Initialize isAutofocus based on a new prop, defaulting to false.
    let isAutofocusEnabledForForm = auto_focus === true;

    if (data?.inputs) {
        const inputKeys = Object.keys(data.inputs); // Get keys to ensure order
        for (const key of inputKeys) { // Iterate with for...of to respect order and allow early exit logic
            if ((data.inputs[key].type == "switcher" || data.inputs[key].type == "checkbox") && data.inputs[key].checked == false)
                data.inputs[key].value = 0;

            // 2. If autofocus is enabled for this form, apply to the first field and then disable for subsequent fields.
            if (data.inputs[key].type == "text" || data.inputs[key].type == "textarea") {
                if (isAutofocusEnabledForForm) {
                    data.inputs[key].auto_focus = true;
                    isAutofocusEnabledForForm = false; // Ensure only the first field gets autofocus
                }
                else {
                    data.inputs[key].auto_focus = false;
                }
            }

            ['visibility', 'selector'].forEach(type => {

                if (checkInputType(type, name, data.inputs[key].name)) {

                    data.inputs[key].origtype = data.inputs[key].origtype || data.inputs[key].type;
                    data.inputs[key].type = type;
                }
            });

            if (data.inputs[key].value || data.inputs[key].value == 0)
                defaultValues[key] = data.inputs[key].value;
        }
    }

    const { csrf_token, ...restDefaultValues } = defaultValues;

    const cacheKey = request?.url + JSON.stringify(restDefaultValues) || false;

    const onSubmit = async d => {
        FeedbackHaptics('Medium')
        const formData = new FormData();
        Object.keys(d).map(function (key) {
            formData.append(key, d[key]);
            if (data.inputs[key])
                data.inputs[key].value = d[key];
        });
        await onFormSubmit(formData, d);
    }

    const onError = async d => {
        //TODO: gandle error
    }
    const { ...methods } = useForm({
        mode: 'onChange',
    });
    const { formState: { isSubmitted } } = methods;



    useEffect(() => {
        if (methods.formState.isSubmitSuccessful) {
            if (resetOnSubmit)
                methods.reset();
        }
    }, [methods.formState, methods.submittedData, methods.reset]);

    function handleKeyUp(event) {
        if (event.srcElement.tagName == 'DIV' || event.srcElement.tagName == 'TEXTAREA')
            return

        if (event.keyCode === 13) {
            _handleSubmit();
        }
    }

    useEffect(() => {
        if (Platform.OS === 'web') {
            window.addEventListener("keyup", handleKeyUp);
            return () => {
                window.removeEventListener("keyup", handleKeyUp);
            };
        }
    }, []);

    if (data?.reset) {
        //TODO: Set Value without timeout
        setTimeout(() => {
            methods.setValue('cmt_parent_id', defaultValues['cmt_parent_id']);
        }, 100);
    }

    const _handleSubmit = methods.handleSubmit(
        (data) => {
            emitter.emit(`form_${name}`, { action: 'submited' })
            onSubmit(data);
        },
        onError
    );

    useEffect(() => {
        if (isSubmit) {
            _handleSubmit();
        }
    }, [isSubmit]);

    useEffect(() => {
        if (data?.updated)
            emitter.emit(`form_${name}`, { action: 'received' })

    }, [data?.updated]);


    const { watch } = methods;
    const allFields = watch();
    const debouncedFields = useDebounce(allFields, 500);

    useEffect(() => {
        if (isAutoChange && Object.keys(debouncedFields).length > 0) {
            onChange(debouncedFields);
        }
    }, [debouncedFields]);

    useEffect(() => {
        if (cacheKey && debouncedFields && Object.keys(debouncedFields).length > 0) {
            //TOFIX AUTOSAVE IN FORMS
            //storageSet('form', cacheKey, JSON.stringify(debouncedFields), true);
        }
    }, [debouncedFields, cacheKey]);

    //TOFIX AUTOSAVE IN FORMS
    /*
    useEffect(() => {
        const raw = cacheKey ? storageGet('form', cacheKey, true) : false
        if (raw) {
            const draft = JSON.parse(raw);
            const current = methods.getValues();
            const updates = {};

            const keysWithHtml = Object.keys(data.inputs).filter(
                (key) => data.inputs[key].html > 0
            );

            keysWithHtml.forEach((key) => { // HUCK FOR rtf inputs
                if (draft[key] !== undefined) {
                    updates[key] = '<!--INITED-->' + draft[key];
                }
            });
            methods.reset({ ...current, ...draft, ...updates }, { keepDefaultValues: true });
        }

    }, []);*/


    if (isAutoChange) {
        for (const key in data.inputs) {
            if (data.inputs[key] && typeof data.inputs[key] === "object" && data.inputs[key].type === "submit") {
                delete data.inputs[key];
            }
            if (data.inputs[key] && typeof data.inputs[key] === "object" && data.inputs[key].name === "csrf_token") {
                delete data.inputs[key];
            }
        }

    }

    let inputs = getFormFieldList(name, data?.inputs, _handleSubmit, true, null, saveOnChanges, formProps);

    if (inputs?.length > 0)
        inputs = inputs.filter(item => ((item.key !== null && item.key.toString() !== '') || item.props.type == 'block_end'))

    if (inputs) {
        inputs = inputs.map((input, index) => ({
            ...input,
            props: {
                ...input.props,
                form_layout: layout,
                use_caption_as_placeholder: appSetting('forms', 'without_captions').includes(name) ? true : false,
                ...(index === inputs.length - 1 - inputs.slice().reverse().findIndex(input => input.props?.type !== "hidden") && { noPadding: true }),
                ...(index === inputs.length - 1 - inputs.slice().reverse().findIndex(input => input.props?.type !== "hidden") && { noPadding: true })
            },
        }));
    }

    const ElementForm = getFormType(name)
    if ('undefined' !== typeof ElementForm) {
        inputs = <ElementForm name={name} data={data} response={response} handleSubmit={_handleSubmit} exProps={exProps}></ElementForm>
        return (
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        )
    }


    const defaultFormValues = Object.keys(allFields).reduce((result, key) => {
        if (defaultValues.hasOwnProperty(key) && data.inputs[key].type !== 'location') {
            result[key] = defaultValues[key];
        }
        return result;
    }, {});

    const currentFormValues = data?.inputs ? Object.keys(data.inputs).reduce((result, key) => {
        if (data.inputs[key].type !== 'location') {
            result[key] = allFields[key];
        }
        else {
            if (allFields[key + '_country'])
                result[key] = allFields[key + '_country'];
        }
        return result;
    }, {}) : [];

    let Element = null
    if (otherData) {
        Element = getComponent('element', String(otherData.type))

    }

    if (onFormEmpty && dynamicData && dynamicData.data?.length == 0) {
        onFormEmpty();
    }

    return (
        <>
            {otherData && <Element {...otherData} />}
            <View className={`${layout !== 'hor' ? appSetting('forms', 'form_container') : 'w-full'} ${exProps?.classes}`}>
                <FormProvider {...methods}>
                    <View className={`${layout === 'hor' ? 'flex-row gap-x-4 items-center w-full' : appSetting('forms', 'form_container')}`}>
                        {inputs}
                        {(isAutoChange && layout === 'hor') && <Row className='items-center justify-between '>
                            {!isObjectsEqual(defaultFormValues, currentFormValues) && <Button
                                title='Reset Filters'
                                startDecorator='X'
                                size='sm'
                                variant='secondary'
                                onPress={() => methods.reset()}
                            />
                            }
                        </Row>}
                    </View>
                </FormProvider>
            </View>
        </>

    );
}