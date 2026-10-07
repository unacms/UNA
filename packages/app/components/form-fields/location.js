import Field from './_field';
import { Input } from 'app/design/controls'
import { useLocationField } from 'app/lib/form/use-form-field';
import { LocationSuggest } from 'app/lib/form/form-fields-helpers';
import { useTranslation } from 'react-i18next';

export default function FormFieldLocation({ name, value, onChange, ...props }) {
    const { t } = useTranslation();
    const loc = useLocationField({ name, value, onChange, syncName: true });

    return (
        <Field classes="z-50" {...props}>
            <Input
                placeholder={t('Start typing your address')}
                value={loc.term}
                onChangeText={loc.onChangeText}
            />
            <LocationSuggest
                searchError={loc.searchError}
                selectionMade={loc.selectionMade}
                locationResults={loc.locationResults}
                onSelect={loc.onSelect}
            />
        </Field>
    );
}
