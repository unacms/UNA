import { useEffect, useState, useMemo, useCallback, useId, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getFormFieldByData, isFormResponseComplete, normalizeFormResponseData, updateFormDirtyState, isFormUnsavedCloseGuardSkipped, formHasPendingUploads, clearFormPendingUploads, formResponseHasFieldErrors, FILES_FIELD_MIRRORS } from 'app/lib/form/form-helpers'
import { getDefaultPasteStorageKey } from 'app/components/form-fields/media-attachments'
import { markFormBaseline } from 'app/lib/form/use-form-field'
import { getFormInitialValues } from 'app/lib/form/form-initial-values'
import { View, Row } from 'app/design/view'
import { components } from 'app/components/registry';
import { FeedbackHaptics, appSetting, isNumeric, isObjectsEqual } from 'app/lib/util';
import { sessionCacheGet, sessionCacheSet } from 'app/lib/util/storage';
import { Platform } from 'react-native';
import emitter, { EVENTS } from 'app/context/emitter';
import { FormInstanceProvider } from 'app/context/form-instance';
import useDebounce from 'app/lib/hooks/use-debounce'
import { NeoButton } from 'app/design/controls';
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import { FormError } from 'app/components/form-fields/_field'
import { useTranslation } from 'react-i18next'
import { useRouter, usePathname, redirectTo } from 'app/lib/hooks/router'
import { getTabKeyFromPathname } from 'app/lib/navigation/tab-history'

const isWeb = Platform.OS === 'web';
const EMPTY_WATCH = {};

/** Resolve UNA redirect block URI (same rules as elements/redirect). */
function resolveRedirectUri(redirectItem) {
    const rawUri = redirectItem?.data?.uri;
    if (!rawUri || rawUri === '/') return '/home';
    return rawUri;
}

function FormProviders({ instanceId, methods, children }) {
    return (
        <FormInstanceProvider instanceId={instanceId}>
            <FormProvider {...methods}>
                {children}
            </FormProvider>
        </FormInstanceProvider>
    );
}

function getFormType(name) {
    return components['form'][String(name)]
}

function getFormFieldList(name, inputs, handleSubmit, isInitial = false, lastChangedField, saveOnChanges, formProps) {

    const ElementForm = getFormType(name);

    if ('undefined' !== typeof ElementForm && isInitial) {
        return;
    }

    if (!inputs) {
        return;
    }

    const defaultStorageKey = getDefaultPasteStorageKey(inputs)

    return Object.keys(inputs).map(function (key) {
        return getFormFieldByData(
            inputs[key],
            handleSubmit,
            'default',
            {
                ...formProps,
                form_name: name,
                last_changed: lastChangedField,
                saveOnChanges: saveOnChanges,
                ...(defaultStorageKey && key === defaultStorageKey ? { asDefaultStorage: true } : null),
            },
            key
        )
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
    const router = useRouter();
    const pathname = usePathname();
    const isAutoChange = !!onChange;
    const { auto_focus, ...formProps } = initedFormProps ?? {};

    const { ...methods } = useForm({ mode: 'onChange' });
    // Proxy formState: only accessed properties subscribe. Reading isDirty on a
    // 30-field form (playground, create) re-renders the whole tree on every
    // setValue and can loop with editors that sync HTML back into RHF.
    const formInstanceId = useId();
    // Avoid double navigation if the response effect re-runs with the same redirect.
    const redirectedUriRef = useRef(null);

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
    const trackUnsavedDirty = !skipUnsavedCloseGuard && !isAutoChange;
    const isSubmitted = methods.formState.isSubmitted;
    const isSubmitSuccessful = methods.formState.isSubmitSuccessful;
    const isDirty = trackUnsavedDirty ? methods.formState.isDirty : false;

    useEffect(() => {
        // Auto-change forms (filters etc.) persist on every change, so they can
        // never hold unsaved changes — never let them block closing.
        if (!trackUnsavedDirty) {
            updateFormDirtyState(formInstanceId, false);
            return () => updateFormDirtyState(formInstanceId, false);
        }
        const dirty = isDirty && !isSubmitSuccessful;
        updateFormDirtyState(formInstanceId, dirty);
        return () => updateFormDirtyState(formInstanceId, false);
    }, [formInstanceId, isDirty, isSubmitSuccessful, trackUnsavedDirty]);

    // Pending uploads live in a module Map keyed by useId() — that id is often
    // reused when Create Post remounts, so orphaned ids would stick Publish in
    // loading until a full page refresh. Clear markers only (do not abort
    // network): ImagePicker remounts resume via uploadId + inFlightUploadIds.
    useEffect(() => {
        return () => clearFormPendingUploads(name, formInstanceId);
    }, [name, formInstanceId]);

    const { data: dynamicData, error: submitError } = useFetchForm(request?.url, postData);

    useEffect(() => {
        if (submitError) {
            emitter.emit(EVENTS.form(name), { action: 'received', formInstanceId });
        }
    }, [submitError, name, formInstanceId]);

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
            emitter.emit(EVENTS.form(name), { action: 'received', formInstanceId, data: rawData });
            return;
        }

        const items = normalizeFormResponseData(rawData);

        if (!items.length) return;

        const formItem = items.find(item => item?.type === 'form');
        const redirectItem = items.find(item => item?.type === 'redirect');
        // Prefer non-redirect extras for Element rendering; redirect is handled below
        // (formOnly modals close before ElementRedirect can run its effect).
        const otherItem = items.find(
            item => item?.type && item?.type !== 'form' && item?.type !== 'redirect'
        );
        // hide_on_msg: replace form only when response is msg-only (success).
        // If UNA also returns a form (validation errors), keep the form and drop the msg.
        const hideOnMsg = !!(appSetting('forms', name) || {}).hide_on_msg;

        if (redirectItem) {
            const uri = resolveRedirectUri(redirectItem);
            if (redirectedUriRef.current !== uri) {
                redirectedUriRef.current = uri;
                redirectTo(router, uri, getTabKeyFromPathname(pathname));
            }
        }

        setFormBundle(prev => {
            const nextForm = formItem?.data
                ? { ...formItem.data, updated: Date.now() }
                : { ...prev.form, updated: Date.now() };

            const nextResponse = formItem?.response ?? prev.response;
            // Redirect is navigated above — do not mount ElementRedirect (double nav /
            // formOnly unmount race). Keep msg and other extras as usual.
            const nextExtra = hideOnMsg && formItem && formResponseHasFieldErrors(rawData)
                ? null
                : (otherItem ?? (redirectItem ? null : prev.extra));

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

        emitter.emit(EVENTS.form(name), { action: 'received', formInstanceId, data: rawData });
    }, [dynamicData, initedData, formInstanceId, name, router, pathname]);

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

        if (formResponseHasFieldErrors(dynamicData.data)) return;

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

            // defaultValues — price comes as `{ value, currency }` from UNA API
            if (input.type === 'price') {
                const amount =
                    input.value != null && typeof input.value === 'object'
                        ? input.value.value
                        : input.value;
                dv[key] = amount == null || amount === '' ? '' : String(amount);
            } else if (input.value || input.value === 0) {
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

    // Form default values = every field's untouched value (field-initial-values),
    // set as soon as the form data arrives — code-split fields may not have
    // loaded yet, so isDirty must not depend on what has mounted. RHF does not
    // merge a field's own defaultValue into the form defaults. Types without an
    // initial-value rule keep what they hold now; later ones baseline themselves
    // at mount (useFieldController).
    const isFirstResetRef = useRef(true);
    useEffect(() => {
        if (!processedInputs) return;
        const initialValues = getFormInitialValues(processedInputs);

        if (isFirstResetRef.current) {
            isFirstResetRef.current = false;
            methods.reset({ ...methods.getValues(), ...initialValues }, {
                keepErrors: true,
                keepTouched: true,
                keepIsSubmitted: true,
                keepSubmitCount: true,
            });
            markFormBaseline(methods.control);
            return;
        }
        if (!formBundle?.form?.updated) return;

        const legacyValues = Object.keys(processedInputs).reduce((result, key) => {
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
        const values = { ...legacyValues, ...initialValues };

        // Validation errors: UNA re-renders the form without the files uploaded for this
        // submit, so keep what the files fields (and the ids they mirror) hold now.
        if (formResponseHasFieldErrors(dynamicData?.data)) {
            for (const [key, input] of Object.entries(processedInputs)) {
                if (input?.type !== 'files') continue;
                for (const k of [key, FILES_FIELD_MIRRORS[key]]) {
                    if (k) values[k] = methods.getValues(k) ?? '';
                }
            }
        }

        // No keepDefaultValues: the server-provided values become the new baseline,
        // so a just-updated (untouched) form is not treated as dirty by the
        // unsaved-changes close guard.
        methods.reset(values);
        methods.clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processedInputs, formBundle?.form?.updated]);

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
                    if (formHasPendingUploads(name, formInstanceId)) {
                        return;
                    }
                    // awaitsResponse: the form posts to UNA itself and emits 'received' with the reply.
                    emitter.emit(EVENTS.form(name), { action: 'submited', formInstanceId, awaitsResponse: !onFormSubmitInternal });
                    onSubmit(data);
                    if (onFormSubmitInternal) {
                        emitter.emit(EVENTS.form(name), { action: 'received', formInstanceId });
                    }
                },
                onError
            ),
        [methods, name, formInstanceId, onSubmit, onError, onFormSubmitInternal]
    );

    const handleKeyUp = useCallback((event) => {
        if (event.key !== 'Enter' && event.keyCode !== 13) return;
        // TipTap is a DIV; after submit it blurs and keyup lands on BODY,
        // which used to submit the now-empty comment form a second time.
        if (event.target?.tagName !== 'INPUT') return;
        _handleSubmit();
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

    // watch() subscribes the whole Form to every field write. Only filter
    // (onChange) forms need that; kitchen-sink / regular submit forms do not.
    const allFields = isAutoChange ? methods.watch() : EMPTY_WATCH;
    const debouncedFields = useDebounce(allFields, 500);

    useEffect(() => {
        if (isAutoChange && onChange && Object.keys(debouncedFields).length > 0) {
            sessionCacheSet('form:' + cacheKey, debouncedFields);
            onChange(debouncedFields);
        }
    }, [debouncedFields, isAutoChange, onChange, cacheKey]);


    
    useEffect(() => {
        if (isAutoChange && onChange) {
            if (!processedInputs) return
            const raw = cacheKey ? sessionCacheGet('form:' + cacheKey) : null
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
                use_caption_as_placeholder:
                    input.props.use_caption_as_placeholder ??
                    appSetting('forms', 'without_captions').includes(name),
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


    const Element = formBundle.extra ? components['element'][String(formBundle.extra.type)] : null;
    const formSettings = appSetting('forms', name) || {};
    const hideFormOnMsg = formSettings.hide_on_msg && formBundle.extra?.type === 'msg';

    function stableStringify(obj) {
        return JSON.stringify(
            Object.keys(obj).sort().reduce((acc, k) => (acc[k] = obj[k], acc), {})
        );
    }

    const errorMessage = submitError ? (
        <FormError errorText={t('Something didn’t go as planned. Please try again or reload the page.')} />
    ) : null;

    if ('undefined' !== typeof ElementForm) {
        inputs = <ElementForm name={name} data={{ ...formBundle?.form, inputs: filteredInputs }} response={formBundle.response} handleSubmit={_handleSubmit} exProps={exProps}></ElementForm>
        return (
            <FormProviders instanceId={formInstanceId} methods={methods}>
                {Element && <Element {...formBundle.extra} />}
                {errorMessage}
                {!hideFormOnMsg ? inputs : null}
            </FormProviders>
        )
    }

    return (
        <FormProviders instanceId={formInstanceId} methods={methods}>
            <View className={`${layout !== 'hor' ? appSetting('forms', 'form_container') : 'w-full'} ${exProps?.classes}`}>
                {Element && <Element {...formBundle.extra} />}
                {errorMessage}
                {!hideFormOnMsg ? (
                    <View className={`${layout === 'hor' ? 'flex-row gap-x-4 items-center w-full' : 'w-full gap-4'}`}>
                        {inputs}
                        {(isAutoChange) && <Row className={`items-center justify-between  ${layout === 'hor' ? ' ' : ' '} `}>
                            {(stableStringify(defaultFormValues) != stableStringify(currentFormValues)) && <NeoButton
                                controlSize="small"
                                width="fill"
                                image="X"
                                label={t('Reset Filters')}
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
                ) : null}
            </View>
        </FormProviders>
    );
}
