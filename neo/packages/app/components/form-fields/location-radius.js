import Field from './_field';
import { Input } from 'app/design/controls'
import { View } from 'app/design/view'
import { useLocationField } from 'app/lib/form/use-form-field';
import { LocationSuggest } from 'app/lib/form/form-fields-helpers';
import { useTranslation } from 'react-i18next';

export default function FormFieldLocationRadius({ name, value, onChange, ...props }) {
    const { t } = useTranslation();
    const loc = useLocationField({
        name,
        value,
        onChange,
        syncName: false,
        extraSuffixes: ['_rad'],
    });

    return (
        <Field classes="z-50 @container/input-lr " {...props}>
            <View className="@sm/input-lr:flex-row w-full gap-2">
                <View className="w-full min-w-0 @sm/input-lr:flex-1">
                    <Input
                        placeholder={t('Start typing your address')}
                        value={loc.term}
                        onChangeText={loc.onChangeText}
                    />
                </View>
                <View className="w-full @sm/input-lr:w-36 @sm/input-lr:flex-none">
                    <Input
                        placeholder={t('Radius, in Km')}
                        onChangeText={loc.setRadius}
                    />
                </View>
            </View>
            <LocationSuggest
                searchError={loc.searchError}
                selectionMade={loc.selectionMade}
                locationResults={loc.locationResults}
                onSelect={loc.onSelect}
            />
        </Field>
    );
}
