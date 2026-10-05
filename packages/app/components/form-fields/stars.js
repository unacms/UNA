import Field, { getValidationRules } from './_field';
import { StarsAction } from 'app/ui/atoms/stars';
import { useFormField } from 'app/lib/form/use-form-field';

export default function FormFieldStars(props) {
    const { field } = useFormField(props, {
        rules: getValidationRules(props),
    });

    return (
        <Field {...props}>
            <StarsAction rating={Number(field.value)} onChange={field.onChange} />
        </Field>
    );
}
