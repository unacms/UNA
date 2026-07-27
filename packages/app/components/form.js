import { useEffect, useState, useMemo, useCallback, useId, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getFormFieldByData, isFormResponseComplete, normalizeFormResponseData, updateFormDirtyState, isFormUnsavedCloseGuardSkipped } from 'app/lib/form-helpers'
import { View, Row } from 'app/design/view'
import { getComponent } from 'app/components/registry';
import { FeedbackHaptics, storageSet, appSetting, isNumeric, storageGet, isObjectsEqual } from 'app/lib/util';
import { Platform } from 'react-native';
import emitter from 'app/context/emitter';
import { FormInstanceProvider } from 'app/context/form-instance';
import useDebounce from 'app/lib/hooks/debounce'
import { Button } from 'app/design/controls';
import useFetchForm from 'app/lib/hooks/fetch'
import { useTranslation } from 'react-i18next'

const isWeb = Platform.OS === 'web';

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
        return getFormFieldByData(inputs[key], handleSubmit, 'default', { ...formProps, form_name: name, last_changed: lastChangedField, saveOnChanges: saveOnChanges }, key)
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
    request,
    url,
}) {
    const { t } = useTranslation();
    const isAutoChange = !!onChange;
    const { auto_focus, ...formProps } = initedFormProps ?? {};

    const { ...methods } = useForm({ mode: 'onChange' });
    const { formState: { isSubmitted, isDirty, isSubmitSuccessful } } = methods;
    const formInstanceId = useId();

    const [postData, setPostData] = useState(null);

    const [formBundle, setFormBundle] = useState({
        form: initedData,
        extra: null,
        response: null,
        //request: request,
    });

    const name = formBundle.form?.params?.display?.includes('_delete') ? '' : (formName || formBundle.form?.params?.display)

    const skipUnsavedCloseGuard =
        exProps?.skipUnsavedCloseGuard === true || isFormUnsavedCloseGuardSkipped(name);

    useEffect(() => {
        // Auto-change forms (filters etc.) persist on every change, so they can
        // never hold unsaved changes — never let them block closing.
        if (skipUnsavedCloseGuard || isAutoChange) {
            updateFormDirtyState(formInstanceId, false);
            return () => updateFormDirtyState(formInstanceId, false);
        }
        const dirty = isDirty && !isSubmitSuccessful;
        updateFormDirtyState(formInstanceId, dirty);
        return () => updateFormDirtyState(formInstanceId, false);
    }, [formInstanceId, isDirty, isSubmitSuccessful, skipUnsavedCloseGuard, isAutoChange]);

    // RHF quirk: field-level defaultValue (useController) is NOT merged into the
    // form-level _defaultValues, and useForm() here has no defaultValues. isDirty
    // compares values against an empty baseline, so any prefilled form (even just
    // a csrf_token hidden input) is instantly "dirty". Re-baseline once after the
    // fields have registered and run their mount-time value syncs.
    const isDirtyBaselineSetRef = useRef(false);
    useEffect(() => {
        if (isDirtyBaselineSetRef.current || !formBundle.form?.inputs) return;
        isDirtyBaselineSetRef.current = true;
        methods.reset(methods.getValues(), {
            keepErrors: true,
            keepTouched: true,
            keepIsSubmitted: true,
            keepSubmitCount: true,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formBundle.form?.inputs]);

    const { data: dynamicData } = useFetchForm(request?.url, postData);

    // update state when form is submitted
    const onFormSubmit = onFormSubmitInternal ?? ((formData, d) => {
        if (request?.url) {
            setPostData(formData);
        }
    });
    useEffect(() => {

        if (!dynamicData) {

            // No dynamic data — revert to original
            setFormBundle(prev => ({
                ...prev,
                form: initedData,
                extra: null,
                response: null,
            }));
            return;
        }

        const rawData = dynamicData.data;

        if (isFormResponseComplete(rawData)) {
            setFormBundle(prev => ({
                ...prev,
                form: { ...prev.form, completed: Date.now() },
                extra: null,
                response: null,
            }));
            emitter.emit(`form_${name}`, { action: 'received', formInstanceId, data: rawData });
            return;
        }

        const items = normalizeFormResponseData(rawData);

        if (!items.length) return;

        const formItem = items.find(item => item?.type === 'form');
        const otherItem = items.find(item => item?.type && item?.type !== 'form');
        // hide_on_msg: replace form only when response is msg-only (success).
        // If UNA also returns a form (validation errors), keep the form and drop the msg.
        const hideOnMsg = !!(appSetting('forms', name) || {}).hide_on_msg;

        setFormBundle(prev => {
            const nextForm = formItem?.data
                ? { ...formItem.data, updated: Date.now() }
                : { ...prev.form, updated: Date.now() };

            const nextResponse = formItem?.response ?? prev.response;
            const nextExtra = hideOnMsg && formItem
                ? null
                : (otherItem ?? prev.extra);

            // Optional: skip setState when nothing actually changed
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

        emitter.emit(`form_${name}`, { action: 'received', formInstanceId, data: rawData });
    }, [dynamicData, initedData, formInstanceId, name]);

    useEffect(() => {
        if (!onFormEmpty || !dynamicData) return;
        if (isFormResponseComplete(dynamicData.data)) {
            onFormEmpty();
            return;
        }
        // Modal / formOnly: UNA often returns msg, redirect, or the same form
        // again with no field errors — treat those as done so parents can reload.
        // A different form (wizard / next step) must keep the modal open.
        if (!exProps?.formOnly) return;

        const items = normalizeFormResponseData(dynamicData.data);
        if (!items.length) {
            onFormEmpty();
            return;
        }

        const formItem = items.find((item) => item?.type === 'form');
        const nextDisplay = formItem?.data?.params?.display || formItem?.name;
        const currentDisplay = formName || formBundle.form?.params?.display;
        const isNextStepForm =
            !!formItem &&
            !!nextDisplay &&
            !!currentDisplay &&
            nextDisplay !== currentDisplay;
        if (isNextStepForm) return;

        const hasFieldErrors = formItem
            ? Object.values(formItem.data?.inputs || {}).some((input) => {
                  const err = input?.error;
                  if (!err) return false;
                  if (Array.isArray(err)) return !!String(err[0] || '').trim();
                  return !!String(err).trim();
              })
            : false;
        if (hasFieldErrors) return;

        const done = items.some(
            (item) =>
                item?.type === 'msg' ||
                item?.type === 'redirect' ||
                item?.type === 'form'
        );
        if (done) onFormEmpty();
    }, [onFormEmpty, dynamicData, exProps?.formOnly, formName, formBundle.form?.params?.display]);

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

            // Copy — do NOT mutate the original
            const input = { ...src };

            // switcher/checkbox: false > value = 0
            if (
                (input.type === 'switcher' || input.type === 'checkbox') &&
                input.checked === false
            ) {
                input.value = 0;
            }

            // autofocus only the first text/textarea field
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

    useEffect(() => {
        if (!processedInputs) return;
    
        Object.entries(processedInputs).forEach(([key, input]) => {
            if (!input?.error) return;
            const message = Array.isArray(input.error) ? input.error[0] : input.error;
            const link = Array.isArray(input.error) ? input.error[1] : null;
            if (message) {
                methods.setError(key, {
                    type: 'server',
                    message,
                    ...(link && { link }),
                });
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processedInputs]);

    useEffect(() => {
        if (!formBundle?.form?.updated || !processedInputs) return;

        const values = Object.keys(processedInputs).reduce((result, key) => {
            const input = processedInputs[key];
            if (input?.value || input?.value === 0) {
                result[key] = input.value;
            } else if (input?.type === 'switcher' || input?.type === 'checkbox') {
                result[key] = input.checked ? input.value : '0';
            } else {
                result[key] = '';
            }
            return result;
        }, {});

        // No keepDefaultValues: the server-provided values become the new baseline,
        // so a just-updated (untouched) form is not treated as dirty by the
        // unsaved-changes close guard.
        methods.reset(values);
        methods.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formBundle?.form?.updated]);

    const { csrf_token, ...restDefaultValues } = defaultValues;
    // Include page url (not uri — uri can be shared across different pages) so
    // auto-change filter drafts do not bleed between routes.
    const cacheKey = `${formName}_${request?.url || false}_${url || ''}`;

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
                    emitter.emit(`form_${name}`, { action: 'submited', formInstanceId });
                    onSubmit(data);
                },
                onError
            ),
        [methods, name, formInstanceId, onSubmit, onError]
    );

    const handleKeyUp = useCallback((event) => {
        const tag = event.target?.tagName;
        if (tag === 'DIV' || tag === 'TEXTAREA') return;

        if (event.key === 'Enter' || event.keyCode === 13) {
            _handleSubmit();
        }
    }, [_handleSubmit]);

    useEffect(() => {
        if (isWeb) {
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

    const { watch } = methods;
    const allFields = watch();
    const debouncedFields = useDebounce(allFields, 500);

    useEffect(() => {
        if (isAutoChange && onChange && Object.keys(debouncedFields).length > 0) {
            storageSet('form', cacheKey, debouncedFields, false);
            onChange(debouncedFields);
        }
    }, [debouncedFields, isAutoChange, onChange, cacheKey]);


    
    useEffect(() => {
        if (isAutoChange && onChange) {
            if (!processedInputs) return
            const raw = cacheKey ? storageGet('form', cacheKey, false) : false
            if (raw) {
                const draft = typeof raw === 'string' ? JSON.parse(raw) : raw
                const current = methods.getValues();
                const updates = {};

                const keysWithHtml = Object.keys(processedInputs).filter(
                    (key) => processedInputs[key].html > 0
                );

                keysWithHtml.forEach((key) => { // HUCK FOR rtf inputs
                    if (draft[key] !== undefined) {
                        // updates[key] = '<!--INITED-->' + draft[key];
                    }
                });
                methods.reset({ ...current, ...draft, ...updates }, { keepDefaultValues: true });
            }
        }
    }, [isAutoChange, onChange, cacheKey, processedInputs]);


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


    const defaultFormValues = Object.keys(allFields).reduce((result, key) => {
        const field = filteredInputs?.[key];
        const fieldType = field?.type;
        const hasDefaultValue = key in defaultValues;

        if (fieldType === 'location') {
            result[key] = '';
            return result;
        }

        if (fieldType === 'switcher') {
            result[key] = field?.checked || '0';
            return result;
        }

        result[key] = hasDefaultValue ? defaultValues[key] : '';
        return result;
    }, {});

    const currentFormValues = filteredInputs ? Object.keys(filteredInputs).reduce((result, key) => {
        if (filteredInputs?.[key].type !== 'location') {
            result[key] = isNumeric(allFields[key]) ? allFields[key].toString() : allFields[key];
        }
        else {
            if (allFields[key + '_country'])
                result[key] = allFields[key + '_country'];
            else
                result[key] = '';
        }
        return result;
    }, {}) : [];


    const Element = formBundle.extra ? getComponent('element', String(formBundle.extra.type)) : null;
    const formSettings = appSetting('forms', name) || {};
    const hideFormOnMsg = formSettings.hide_on_msg && formBundle.extra?.type === 'msg';

    function stableStringify(obj) {
        return JSON.stringify(
            Object.keys(obj).sort().reduce((acc, k) => (acc[k] = obj[k], acc), {})
        );
    }

    if ('undefined' !== typeof ElementForm) {
        inputs = <ElementForm name={name} data={{ ...formBundle?.form, inputs: filteredInputs }} response={formBundle.response} handleSubmit={_handleSubmit} exProps={exProps}></ElementForm>
        return (
            <FormInstanceProvider instanceId={formInstanceId}>
                <FormProvider {...methods}>
                    {Element && <Element {...formBundle.extra} />}
                    {!hideFormOnMsg ? inputs : null}
                </FormProvider>
            </FormInstanceProvider>
        )
    }

    return (
        <FormInstanceProvider instanceId={formInstanceId}>
            <View className={`${layout !== 'hor' ? appSetting('forms', 'form_container') : 'w-full'} ${exProps?.classes}`}>
                {Element && <Element {...formBundle.extra} />}
                {!hideFormOnMsg ? (
                    <FormProvider {...methods}>
                        <View className={`${layout === 'hor' ? 'flex-row gap-x-4 items-center w-full' : 'w-full gap-4'}`}>
                            {inputs}
                            {(isAutoChange) && <Row className={`items-center justify-between  ${layout === 'hor' ? ' ' : ' '} `}>
                                {(stableStringify(defaultFormValues) != stableStringify(currentFormValues)) && <Button
                                    title={t('Reset Filters')}
                                    startDecorator='X'
                                    size='sm'
                                    fullWidth
                                    variant='secondary'
                                    onPress={() => {
                                        if (isWeb) {
                                            const url = new URL(window.location.href);
                                            if (url.searchParams.has('filters')) {
                                                url.searchParams.delete('filters');
                                                window.location.replace(`${url.pathname}${url.search}${url.hash}`);
                                            }
                                        }
                                        methods.reset();
                                    }}
                                />
                                }
                            </Row>}
                        </View>
                    </FormProvider>
                ) : null}
            </View>
        </FormInstanceProvider>
    );
}