import Field from './_field';
import Html from 'app/ui/atoms/html';
import { useFormField } from 'app/lib/form/use-form-field';
import { looksLikeHtml, stripTags } from 'app/lib/util';

function normalize(s) {
    return stripTags(s)?.trim() || '';
}

export default function FormFieldValue(props) {
    const { field } = useFormField(props);
    const value = field.value;
    const isHtml = looksLikeHtml(value);
    const caption = normalize(props.caption);
    const text = isHtml ? String(value ?? '') : normalize(value);
    const label = caption ? `${caption}:` : '';

    if (!text) return null;

    return (
        <Field {...props} caption={isHtml ? label : [label, text].filter(Boolean).join(' ')}>
            {isHtml ? <Html data={value} /> : null}
        </Field>
    );
}
