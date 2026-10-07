import { Hidden } from 'app/design/controls'
import { useFormField } from 'app/lib/form/use-form-field';

export default function FormFieldHidden(props) {
    const { name, field } = useFormField(props);

    return (
        <Hidden
            name={name}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            value={String(field.value)}
        />
    );
}
