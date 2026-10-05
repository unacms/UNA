import { useState } from 'react';
import CountryFlag from 'react-native-country-flag';
import { countries } from 'country-codes-flags-phone-codes';
import { useTranslation } from 'react-i18next';
import { Row, View } from 'app/design/view';
import { Button, Input, Modal } from 'app/design/controls';
import RbList from 'app/ui/molecules/form-controls/radio-list';
import Field from './_field';
import { useFormField } from 'app/lib/form/use-form-field';

const DEFAULT_COUNTRY = 'us';
const DEFAULT_PLACEHOLDER = '(123) 456-7890';

const COUNTRY_OPTIONS = countries.map((country) => {
    const value = country.code.toLowerCase();
    return {
        label: country.name,
        value,
        dialCode: country.dialCode,
        icon: <CountryFlag isoCode={value} size={20} />,
    };
});

const COUNTRY_BY_CODE = new Map(COUNTRY_OPTIONS.map((country) => [country.value, country]));
const COUNTRY_BY_DIAL = new Map();
for (const country of COUNTRY_OPTIONS) {
    if (!COUNTRY_BY_DIAL.has(country.dialCode)) {
        COUNTRY_BY_DIAL.set(country.dialCode, country);
    }
}

function countryCodeFromValue(value) {
    const dialCode = String(value ?? '').split(' ')[0];
    return COUNTRY_BY_DIAL.get(dialCode)?.value || '';
}

function nationalFromValue(value, dialCode) {
    const raw = String(value ?? '');
    if (!raw) return '';
    if (raw.startsWith(`${dialCode} `)) return raw.slice(dialCode.length + 1);
    if (raw.startsWith(dialCode)) return raw.slice(dialCode.length).trimStart();
    return raw;
}

function formatNationalNumber(text) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    const area = digits.slice(0, 3);
    const mid = digits.slice(3, 6);
    const last = digits.slice(6, 10);
    if (!area) return '';
    if (digits.length < 3) return `(${area}`;
    if (!mid) return `(${area})`;
    if (!last) return `(${area}) ${mid}`;
    return `(${area}) ${mid}-${last}`;
}

export default function FormFieldPhone(props) {
    const {
        name,
        field,
        placeholder,
        readOnly,
        placeholderTextColor,
        focused,
        onFocus,
        onBlur,
        isAdaptiveLabel,
    } = useFormField(props, { returnKey: false });

    const { t } = useTranslation();
    const [modalVisible, setModalVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedCountryCode, setSelectedCountryCode] = useState(
        () => countryCodeFromValue(field.value) || DEFAULT_COUNTRY
    );

    const selectedCountry =
        COUNTRY_BY_CODE.get(selectedCountryCode) ??
        COUNTRY_BY_CODE.get(DEFAULT_COUNTRY) ??
        COUNTRY_OPTIONS[0];
    const nationalNumber = nationalFromValue(field.value, selectedCountry.dialCode);
    const query = searchValue.trim().toLowerCase();
    const filteredCountries = query
        ? COUNTRY_OPTIONS.filter((country) => country.label.toLowerCase().includes(query))
        : COUNTRY_OPTIONS;

    const commitNumber = (national, dialCode = selectedCountry.dialCode) => {
        field.onChange(national ? `${dialCode} ${national}` : '');
    };

    return (
        <Field {...props} value={field.value} focused={focused} isAdaptiveLabel={isAdaptiveLabel}>
            <Row className="gap-x-2">
                <Button
                    size="lg"
                    startDecorator={
                        <CountryFlag isoCode={selectedCountry.value} size={24} />
                    }
                    title={selectedCountry.dialCode}
                    onPress={() => setModalVisible(true)}
                />
                <Input
                    value={nationalNumber}
                    keyboardType="phone-pad"
                    placeholder={placeholder ?? DEFAULT_PLACEHOLDER}
                    onChangeText={(text) => commitNumber(formatNationalNumber(text))}
                    maxLength={14}
                    autoFocus={props.auto_focus}
                    name={name}
                    readOnly={readOnly}
                    placeholderTextColor={placeholderTextColor}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    aria-label={props.caption}
                />
                <Modal
                    title={t('Choose country')}
                    onClose={() => setModalVisible(false)}
                    onVisible={modalVisible}
                    transparent
                    headerBorder
                    scrollable
                >
                    <View className="pb-2">
                        <Input
                            autoFocus
                            name="search"
                            placeholder={t('Search...')}
                            defaultValue={searchValue}
                            onChangeText={setSearchValue}
                        />
                    </View>
                    <RbList
                        values={filteredCountries}
                        selectedValue={selectedCountryCode}
                        setValue={(code) => {
                            const next = COUNTRY_BY_CODE.get(code);
                            if (!next) return;
                            setSelectedCountryCode(code);
                            commitNumber(nationalNumber, next.dialCode);
                            setSearchValue('');
                            setModalVisible(false);
                        }}
                    />
                </Modal>
            </Row>
        </Field>
    );
}
