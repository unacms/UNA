import { useState, useMemo } from 'react';
import { Row, View } from 'app/design/view'
import CountryFlag from 'react-native-country-flag';
import { countries } from 'country-codes-flags-phone-codes';
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal } from 'app/design/controls'
//import { AsYouType } from 'libphonenumber-js' // for future
import RbList from 'app/ui/molecules/radio_list';

export default function PhoneInput({ value, placeholderTextColor, autoFocus, field, name, ariaLabel, readOnly }) {
    const { t } = useTranslation();

    const countryOptions = countries.map(c => ({
        label: c.name,
        icon: (
            <CountryFlag
                isoCode={c.code.toLowerCase()}
                size={20}
            />
        ),
        value: c.code.toLowerCase(),
        orig: c
    }));


    const [selectedCountryCode, setSelectedCountryCode] = useState(getCountryCodeFromPhone(value) || 'us');
    const selectedCountry = countryOptions.find(c => c.value === selectedCountryCode) || countryOptions[0];
    const [modalVisible, setModalVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [phone, setPhone] = useState(value.replace(selectedCountry.orig.dialCode, ''));

    function getCountryCodeFromPhone(phone) {
        const a = phone.split(' ');
        const country = countries.find(c => c.dialCode == a[0]);
        return country ? country.code.toLowerCase() : '';
    }

    const formatPhone = (digits) => {
        const d = digits.slice(0, 10);
        const part1 = d.slice(0, 3);
        const part2 = d.slice(3, 6);
        const part3 = d.slice(6, 10);

        let result = '';
        if (part1) result += `(${part1}`;
        if (part1 && part1.length === 3) result += ')';
        if (part2) result += ` ${part2}`;
        if (part3) result += `-${part3}`;
        return result;

    };

    const handleChange = (text) => {
        const digits = text.replace(/\D/g, '');
        const sPhone = formatPhone(digits);
        setPhone(sPhone);
        if (sPhone.length === 0)
            field.onChange('');
        else
            field.onChange(`${selectedCountry.orig.dialCode} ${sPhone}`);
    };

    const filteredValues = useMemo(() => {
        return searchValue
            ? countryOptions.filter(item => item.label.toLowerCase().includes(searchValue.toLowerCase()))
            : countryOptions;
    }, [searchValue, countryOptions]);


    return (
        <Row className='gap-x-2'>
            <Button
                size="lg"
                startDecorator={<CountryFlag
                    isoCode={selectedCountryCode}
                    size={24}
                />}
                title={`${selectedCountry.orig.dialCode}`}
                onPress={() => setModalVisible(true)}
            />
            <Input
                value={phone}
                keyboardType="phone-pad"
                placeholder="(123) 456-7890"
                onChangeText={handleChange}
                maxLength={14}
                autoFocus={autoFocus}
                name={name}
                readOnly={readOnly}
                placeholderTextColor={placeholderTextColor}
                onBlur={field.onBlur}
                aria-label={ariaLabel}
            />
            <Modal
                title={'Choose country'}
                onClose={() => { setModalVisible(false) }}
                onVisible={modalVisible}
                transparent
                headerBorder
                scrollable
            >
                {
                    countryOptions.length > 10 && (<View className='pb-2'>
                        <Input autoFocus={true} name="search" placeholder={t('Search...')} defaultValue={searchValue}
                            onChangeText={(value) => {
                                setSearchValue(value)
                            }}
                        />
                    </View>)
                }

                <RbList values={filteredValues} setValue={(val) => {
                    setSelectedCountryCode(val);
                    setPhone('')
                    setModalVisible(false);
                }} selectedValue={selectedCountryCode} />

            </Modal>
        </Row>
    );
}
