import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { getFormFieldByData } from 'app/lib/form-helpers'
import { View } from 'app/design/view'
import { componentsMap } from 'app/components/forms/_map';
import { FeedbackHaptics } from 'app/lib/util';
import { Platform } from 'react-native';
import { appSetting } from 'app/lib/util';

function getFormType(name) {
    return componentsMap[name];
}

function getFormFieldList(name, inputs, handleSubmit, isInitial = false, lastChangedField, saveOnChanges) {

    const ElementForm = getFormType(name);

    if ('undefined' !== typeof ElementForm && isInitial) {
        return;
    }

    if (!inputs) {
        return;
    }

    return Object.keys(inputs).map(function (key) {
        return getFormFieldByData(inputs[key], handleSubmit, 'default', { form_name: name, last_changed:lastChangedField, saveOnChanges:saveOnChanges  })
    });
}

const checkInputType = (name, form_name, input_name) => {
    const setting = appSetting('layout', 'form_' + name + '_control_names');
    if (setting && (setting.includes(form_name + '_' + input_name) || setting.includes('*_' + input_name)))
        return true;

    return false;
}

export default function (props) {
    let data = props.data;
    let response = props.response;
    let onFormSubmit = props.onFormSubmit;
    const [lastChangedField, setLastChangedField] = useState(null);


    let name = props.data.params?.display?.includes('_delete') ? '' : (props.name ? props.name : props.data.params?.display)

    const defaultValues = {}
    if (data.inputs) {
        Object.keys(data.inputs).forEach(function (key) {
            if ((data.inputs[key].type == "switcher" || data.inputs[key].type == "checkbox") && data.inputs[key].checked == false)
                data.inputs[key].value = 0;

            if (checkInputType('visibility', name, data.inputs[key].name)) {
                data.inputs[key].type = 'visibility'
            }
            if (checkInputType('selector', name, data.inputs[key].name)) {
                data.inputs[key].origtype = data.inputs[key].type;
                data.inputs[key].type = 'selector'
            }

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
    //const {...methods} = useForm({defaultValues: defaultValues});  
    const { ...methods } = useForm({
        mode: 'onChange' // This will validate the form fields on change
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


    const { watch } = methods;
    useEffect(() => {
        if (props.saveOnChanges){
            const subscription = watch((value, { name, type }) =>
                setLastChangedField(name)
            )
        
            return () => subscription.unsubscribe()
        }
    }, [watch])

    let inputs = getFormFieldList(name, data.inputs, _handleSubmit, true, lastChangedField, props.saveOnChanges);
    if (inputs?.length > 0)
        inputs = inputs.filter(item => item.key !== null && item.key.toString() !== '')

    if (appSetting('layout', 'form_without_captions').includes(name)) {
        inputs = inputs.map(input => ({
            ...input,
            props: {
                ...input.props,
                use_caption_as_placeholder: true
            },
        }));
    }

    const ElementForm = getFormType(name)
    if ('undefined' !== typeof ElementForm) {
        inputs = <ElementForm data={data} response={response} handleSubmit={_handleSubmit} exProps={props.exProps}></ElementForm>
        return (
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        )
    }

    return (
        <View className=' w-full '>
            {props.onSubmittig && <View className='absolute w-full h-full bg-bgrcard dark:bg-bgrcard-d opacity-70 z-50'></View>}
            {methods.formState.isSubmitting}
            <FormProvider {...methods}>
                {inputs}
            </FormProvider>
        </View>

    );
}