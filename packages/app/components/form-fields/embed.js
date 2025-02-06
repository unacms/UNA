import Field, {getValidationRules} from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import React, { useEffect, useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';
import { ScrollView, View } from 'app/design/view'
import Embed from 'app/ui/molecules/embed'

function InnerEmbed({ url }) {
    const [state, setState] = useState({
        link: null,
        excluded: []
    });

    useEffect(() => {
        const fetchAndSetLink = async () => {
            if (url && url !== state.link?.link) {
                const response = await fetcher(`/api.php?r=${appSetting("urls", "embeds_new")}${url}`);

                    setState(prevState => ({
                        ...prevState,
                        link: { link: url, data: response.data }
                    }));
            } else if (!url) {
                setState(prevState => ({
                    ...prevState,
                    link: null
                }));
            }
        };

        fetchAndSetLink();
    }, [url]); 

    if (state.link && state.link.data) {
        return (
            <View className="w-full mt-2 max-w-md">
                <Embed data={state.link.data} />
            </View>
        );
    }

    return null;
}

export default function FormFieldText(props) {
    //const inputRef = useRef(null);

    const name = props.name;
    const defaultValue = props.value ? props.value : '';
    const rules = getValidationRules(props);
    
    const formContext = useFormContext();
    const video_source = formContext.watch('video_source');
    const { field } = useController({ name, rules, defaultValue });
    
    useEffect(() => {
        if (props.value !== undefined){
           formContext.setValue(props.name, props.value)
        }
    }, [props.name, props.value]);

    const placeholder = props.use_caption_as_placeholder? props.caption : props.placeholder;

    // may be need improve in future
    if (video_source == 'upload')
        return null;

    return (
        <Field {...props} error2={formContext.formState.errors[name]}>
            <Input 
                autoFocus= {true}
              
                name={props.name}
                placeholder = {placeholder}
                placeholderTextColor="#6b7280"
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                value={String(field.value)}
                aria-label={props.caption}
            />
            <InnerEmbed url={field.value}/>
        </Field>
    );
}
