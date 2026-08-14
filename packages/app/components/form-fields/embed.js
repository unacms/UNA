import Field, { getValidationRules } from './_field';
import { useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useEffect, useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view'
import Embed from 'app/ui/molecules/content/embed'
import { useFormField } from 'app/lib/hooks/use-form-field';

function InnerEmbed({ url }) {
    const [state, setState] = useState({
        link: null,
        excluded: []
    });

    useEffect(() => {
        const fetchAndSetLink = async () => {
            if (url && url !== state.link?.link) {
                const response = await fetcher(`/api.php?r=${appSetting("urls", "embeds_new")}${url}`);
                setState((prevState) => ({
                    ...prevState,
                    link: { link: url, data: response.data }
                }));
            } else if (!url) {
                setState((prevState) => ({
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

export default function FormFieldEmbed(props) {
    const {
        name,
        field,
        placeholder,
        placeholderTextColor,
        focused,
        onFocus,
        onBlur,
        isAdaptiveLabel,
    } = useFormField(props, {
        rules: getValidationRules(props),
    });
    const video_source = useFormContext().watch('video_source');

    if (video_source == 'upload') return null;

    return (
        <Field {...props} value={field.value} focused={focused} isAdaptiveLabel={isAdaptiveLabel}>
            <Input
                autoFocus={true}
                name={name}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                onChangeText={field.onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                value={String(field.value)}
                aria-label={props.caption}
            />
            <InnerEmbed url={field.value} />
        </Field>
    );
}
