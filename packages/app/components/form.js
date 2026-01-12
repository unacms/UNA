import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { View, Row } from 'app/design/view'
import { getComponent } from 'app/components/registry';
import { FeedbackHaptics, storageSet, appSetting, isNumeric, storageClear } from 'app/lib/util';
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

export default function Form({
    layout,
    data: initedData,
    name: formName,
    onFormEmpty,
    onFormSubmit: onFormSubmitInternal,
    formProps: initedFormProps,
    resetOnSubmit,
    isSubmit,
    onChange,
    saveOnChanges,
    exProps,
    request
}) {   
    const isAutoChange = !!onChange;
    const { auto_focus, ...formProps } = initedFormProps ?? {};

    const { ...methods } = useForm({ mode: 'onChange' });
    const { formState: { isSubmitted } } = methods;

    const [postData, setPostData] = useState(null);

    const [formBundle, setFormBundle] = useState({
        form: initedData,
        extra: null,
        response: null,
        //request: request,
    });

    const name = formBundle.form?.params?.display?.includes('_delete') ? '' : (formName || formBundle.form?.params?.display)

    const { data: dynamicData } = useFetchForm(request?.url, postData);

    // update state when form is submitted
    const onFormSubmit = onFormSubmitInternal ?? ((formData, d) => {
        if (request?.url) {
            setPostData(formData);
        }
    });  
    useEffect(() => {
      
        if (!dynamicData) {
           
            // Нет динамических данных – возвращаемся к исходным
            setFormBundle(prev => ({
                ...prev,
                form: initedData,
                extra: null,
                response: null,
            }));
            return;
        }

        const items = Array.isArray(dynamicData.data)
            ? dynamicData.data
            : [dynamicData.data];

        if (!items?.length) return;

        const formItem = items.find(item => item?.type === 'form');
        const otherItem = items.find(item => item?.type !== 'form');

        setFormBundle(prev => {
            const nextForm = formItem?.data
                ? { ...formItem.data, updated: Date.now() }
                : { ...prev.form, updated: Date.now() };

            const nextResponse = formItem?.response ?? prev.response;
            const nextExtra = otherItem ?? prev.extra;

            // Опциональная оптимизация — не дёргать setState, если реально ничего не изменилось
            const isSameForm = isObjectsEqual(prev.form, nextForm);
            const isSameExtra = isObjectsEqual(prev.extra, nextExtra);
            const isSameResponse = prev.response === nextResponse;

            if (isSameForm && isSameExtra && isSameResponse) {
                return prev;
            }

            return {
                ...prev,
                form: nextForm,
                extra: nextExtra,
                response: nextResponse,
            };
        });
    }, [dynamicData, initedData]);

    if (onFormEmpty && dynamicData && dynamicData.data?.length == 0) {
        onFormEmpty();
    }

    const { processedInputs, defaultValues } = useMemo(() => {
        const dv = {};
        const processed = {};

        const inputs = formBundle.form?.inputs;
        if (!inputs) {
            return { processedInputs: null, defaultValues: dv };
        }

        const inputKeys = Object.keys(inputs);
        let isAutofocusEnabledForForm = auto_focus === true;

        for (const key of inputKeys) {
            const src = inputs[key];
            if (!src) continue;

            // создаём копию, НЕ мутируем оригинал
            const input = { ...src };

            // switcher/checkbox: false > value = 0
            if (
                (input.type === 'switcher' || input.type === 'checkbox') &&
                input.checked === false
            ) {
                input.value = 0;
            }

            // autofocus только на первое text/textarea поле
            if (input.type === 'text' || input.type === 'textarea') {
                if (isAutofocusEnabledForForm) {
                    input.auto_focus = true;
                    isAutofocusEnabledForForm = false;
                } else {
                    input.auto_focus = false;
                }
            }

            // visibility / selector
            ['visibility', 'selector'].forEach(type => {
                if (checkInputType(type, name, input.name)) {
                    input.origtype = input.origtype || input.type;
                    input.type = type;
                }
            });

            // defaultValues
            if (input.value || input.value === 0) {
                dv[key] = input.value;
            }

            processed[key] = input;
        }

        return { processedInputs: processed, defaultValues: dv };
    }, [formBundle.form?.inputs, auto_focus, name]);

    const { csrf_token, ...restDefaultValues } = defaultValues;
    const cacheKey = request?.url + JSON.stringify(restDefaultValues) || false;

    const onSubmit = async d => {
        FeedbackHaptics('Medium')
        const formData = new FormData();
        Object.keys(d).map(function (key) {
            formData.append(key, d[key]);
            //if (processedInputs[key])
            //      processedInputs[key].value = d[key];
        });
        await onFormSubmit(formData, d);
    }

    const onError = async d => {
        //TODO: handle error
    }


    useEffect(() => {
        if (methods.formState.isSubmitSuccessful) {
            if (resetOnSubmit)
                methods.reset();
        }
    }, [methods.formState, methods.submittedData, methods.reset]);

    const _handleSubmit = useMemo(
        () =>
            methods.handleSubmit(
                (data) => {
                    emitter.emit(`form_${name}`, { action: 'submited' });
                    onSubmit(data);
                },
                onError
            ),
        [methods, name, onSubmit, onError]
    );

    const handleKeyUp = useCallback((event) => {
        const tag = event.target?.tagName;
        if (tag === 'DIV' || tag === 'TEXTAREA') return;

        if (event.key === 'Enter' || event.keyCode === 13) {
            _handleSubmit();
        }
    }, [_handleSubmit]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keyup', handleKeyUp);
            };
        }
    }, [handleKeyUp]);

    useEffect(() => {
        if (!formBundle?.form?.reset) return;
        if (defaultValues['cmt_parent_id'] === undefined) return;

        const id = setTimeout(() => {
            methods.setValue('cmt_parent_id', defaultValues['cmt_parent_id']);
        }, 100);

        return () => clearTimeout(id);
    }, [formBundle?.form?.reset, defaultValues['cmt_parent_id'], methods]);


    useEffect(() => {
        if (isSubmit) {
            _handleSubmit();
        }
    }, [isSubmit, _handleSubmit]);

    useEffect(() => {
        if (formBundle?.form?.updated)
            emitter.emit(`form_${name}`, { action: 'received' })

    }, [formBundle?.form?.updated]);


    const { watch } = methods;
    const allFields = watch();
    const debouncedFields = useDebounce(allFields, 500);

    useEffect(() => {
        if (isAutoChange && onChange && Object.keys(debouncedFields).length > 0) {
            onChange(debouncedFields);
        }
    }, [debouncedFields, isAutoChange, onChange]);

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

            const keysWithHtml = Object.keys(processedInputs).filter(
                (key) => processedInputs[key].html > 0
            );

            keysWithHtml.forEach((key) => { // HUCK FOR rtf inputs
                if (draft[key] !== undefined) {
                    updates[key] = '<!--INITED-->' + draft[key];
                }
            });
            methods.reset({ ...current, ...draft, ...updates }, { keepDefaultValues: true });
        }

    }, []);*/


    const filteredInputs = useMemo(() => {
        if (!processedInputs) return null;
        if (!isAutoChange) return processedInputs;

        const result = {};

        Object.entries(processedInputs).forEach(([key, input]) => {
            if (!input || typeof input !== 'object') return;

            if (input.type === 'submit') return;
            if (input.name === 'csrf_token') return;

            result[key] = input;
        });

        return result;
    }, [processedInputs, isAutoChange]);

    let inputs = getFormFieldList(name, filteredInputs, _handleSubmit, true, null, saveOnChanges, formProps);

    if (inputs?.length) {
        inputs = inputs.filter(
            item =>
                (item.key !== null && item.key.toString() !== '') ||
                item.props.type === 'block_end'
        );

        const lastNonHiddenIndexFromEnd = [...inputs].reverse().findIndex(
            input => input.props?.type !== 'hidden'
        );

        const lastNonHiddenIndex = lastNonHiddenIndexFromEnd === -1 ? -1 : inputs.length - 1 - lastNonHiddenIndexFromEnd;

        inputs = inputs.map((input, index) => ({
            ...input,
            props: {
                ...input.props,
                form_layout: layout,
                use_caption_as_placeholder: appSetting('forms', 'without_captions').includes(name),
                ...(index === lastNonHiddenIndex && { noPadding: true }),
            },
        }));
    }

    const ElementForm = getFormType(name)
    if ('undefined' !== typeof ElementForm) {
        inputs = <ElementForm name={name} data={{...formBundle?.form, inputs: filteredInputs}} response={formBundle.response} handleSubmit={_handleSubmit} exProps={exProps}></ElementForm>
        return (
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        )
    }

    const defaultFormValues = Object.keys(allFields).reduce((result, key) => {
        if (defaultValues.hasOwnProperty(key) && filteredInputs?.[key].type !== 'location') {
            result[key] = defaultValues[key];
        }
        else{
             result[key] ='';
        }
        return result;
    }, {});

    const currentFormValues = filteredInputs ? Object.keys(filteredInputs).reduce((result, key) => {
        if (filteredInputs?.[key].type !== 'location') {
            result[key] = isNumeric(allFields[key]) ? 'vcxv' :allFields[key];
        }
        else {
            if (allFields[key + '_country'])
                result[key] = allFields[key + '_country'];
            else
                 result[key] = '';
        }
        return result;
    }, {}) : [];

    const Element = formBundle.extra ? getComponent('element', String(formBundle.extra.type)) : null

    return (
        <>
            {Element && <Element {...formBundle.extra} />}
            <View className={`${layout !== 'hor' ? appSetting('forms', 'form_container') : 'w-full'} ${exProps?.classes}`}>
                <FormProvider {...methods}>
                    <View className={`${layout === 'hor' ? 'flex-row gap-x-4 items-center w-full' : appSetting('forms', 'form_container')}`}>
                        {inputs}
                        {(isAutoChange ) && <Row className='items-center justify-between absolute -top-4 right-0'>
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