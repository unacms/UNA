import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { componentsMap } from 'app/components/forms/_map';
import { FeedbackHaptics } from 'app/lib/util';
import { Platform } from 'react-native';
import { appSetting } from 'app/lib/util';
import useDebounce from 'app/lib/hooks/debounce'
import { Button } from 'app/design/controls';
import { isObjectsEqual } from 'app/lib/util'

function getFormType(name) {
    return componentsMap[name];
}

function getFormFieldList(name, inputs, handleSubmit, isInitial = false, lastChangedField, saveOnChanges, formProps) {

    const ElementForm = getFormType(name);

    if ('undefined' !== typeof ElementForm && isInitial) {
        return;
    }

    if (!inputs) {
        return;
    }

    console.log("formPropsformProps", formProps)

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

export default function (props) {
    const data = props.data;
    const response = props.response;
    const onFormSubmit = props.onFormSubmit;
    const isAutoChange = !!props.onChange;
    const [lastChangedField, setLastChangedField] = useState(null);

    let name = props.data.params?.display?.includes('_delete') ? '' : (props.name ? props.name : props.data.params?.display)

    const defaultValues = {}
    if (data.inputs) {
        Object.keys(data.inputs).forEach(function (key) {
            if ((data.inputs[key].type == "switcher" || data.inputs[key].type == "checkbox") && data.inputs[key].checked == false)
                data.inputs[key].value = 0;

            ['visibility', 'selector'].forEach(type => {
                if (checkInputType(type, name, data.inputs[key].name)) {
                    data.inputs[key].origtype = data.inputs[key].origtype || data.inputs[key].type;
                    data.inputs[key].type = type;
                }
            });

            if (data.inputs[key].value || data.inputs[key].value == 0)
                defaultValues[key] = data.inputs[key].value;
        });
    }

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
        mode: 'onChange'
    });
    const { formState: { isSubmitted } } = methods;



    useEffect(() => {
        if (methods.formState.isSubmitSuccessful) {
            if (props.resetOnSubmit)
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

    if (data.reset) {
        //TODO: Set Value without timeout
        setTimeout(() => {
            methods.setValue('cmt_parent_id', defaultValues['cmt_parent_id']);
        }, 100);
    }
    let _handleSubmit = methods.handleSubmit(onSubmit, onError)

    useEffect(() => {
        if (props.isSubmit) {
            _handleSubmit();
        }
    }, [props.isSubmit]);

    const { watch } = methods;
    const allFields = watch();
    const debouncedFields = useDebounce(allFields, 500);

    useEffect(() => {
        if (isAutoChange) {
            props.onChange(debouncedFields);
        }
    }, [debouncedFields]);


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
    /*useEffect(() => {
        if (props.saveOnChanges) {
            const subscription = watch((value, { name, type }) =>
                setLastChangedField(name)
            )

            return () => subscription.unsubscribe()
        }
    }, [watch])*/

    let inputs = getFormFieldList(name, data.inputs, _handleSubmit, true, lastChangedField, props.saveOnChanges, props.formProps);
    if (inputs?.length > 0)
        inputs = inputs.filter(item => item.key !== null && item.key.toString() !== '')

    if (inputs) {
        inputs = inputs.map((input, index) => ({
            ...input,
            props: {
                ...input.props,
                use_caption_as_placeholder: appSetting('forms', 'without_captions').includes(name) ? true : false,
                ...(index === inputs.length - 1 - inputs.slice().reverse().findIndex(input => input.props?.type !== "hidden") && { noMargin: true })
            },
        }));
    }

    const ElementForm = getFormType(name)
    if ('undefined' !== typeof ElementForm) {
        inputs = <ElementForm name={name} data={data} response={response} handleSubmit={_handleSubmit} exProps={props.exProps}></ElementForm>
        return (
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        )
    }

    const filteredDefaultValues = Object.keys(allFields).reduce((result, key) => {
        if (defaultValues.hasOwnProperty(key)) {
            result[key] = defaultValues[key];
        }
        return result;
    }, {});

    return (
        <View className='w-full'>
            {(isAutoChange) && <Row className='items-center justify-between mb-3'>
                {/*<Text className="text-xl font-bold text-neutral-800  dark:text-neutral-200 ">Filters</Text>*/}
                {!isObjectsEqual(filteredDefaultValues, allFields) &&  <Button
                title='Reset'
                startDecorator='X'
                size='xs'
                variant='text'
                onPress={() => methods.reset()}
                />
                }
            </Row>}
            {props.onSubmittig && <View className='absolute w-full h-full bg-bgrcard dark:bg-bgrcard-d z-50'></View>}
            {methods.formState.isSubmitting}
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        </View>

    );
}