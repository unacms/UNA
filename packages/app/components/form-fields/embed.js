import Field, { getValidationRules } from './_field';
import { useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useFetch } from 'app/lib/hooks/use-fetch';
import { appSetting } from 'app/lib/util';
import { View } from 'app/design/view'
import Embed from 'app/ui/molecules/content/embed'
import { useFormField } from 'app/lib/form/use-form-field';

function InnerEmbed({ url }) {
    // keepPreviousData: the old preview stays while the next URL resolves.
    const { data: response } = useFetch(
        url ? `/api.php?r=${appSetting("urls", "embeds_new")}${url}` : null,
        { keepPreviousData: true }
    );

    if (url && response?.data) {
        return (
            <View className="w-full mt-2 max-w-md">
                <Embed data={response.data} />
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
