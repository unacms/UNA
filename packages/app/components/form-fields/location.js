import Field from './_field';
import { Text } from 'app/design/typography'
import { InputRef } from 'app/design/controls'
import { useState, } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { appSetting } from 'app/lib/util'
import { useEffect } from 'react'
import { useGoogleAutocomplete } from '@appandflow/react-native-google-autocomplete';
import { View } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { Button } from 'app/design/controls'


export default function FormFieldLocation({ name, value, onChange, ...props }) {
    const [selectionMade, setSelectionMade] = useState(false);
    const formContext = useFormContext();
    const rules = {};
    const defaultValue = props.value ? props.value : '';
    const { field } = useController({ name, rules, defaultValue });
    const {
        locationResults,
        isSearching,
        searchError,
        term,
        setTerm,
        clearSearch,
    } = useGoogleAutocomplete(
        '',
        {
            language: 'en',
            debounce: 300,
            proxyUrl: '/api.php?goo=list&',
        }
    );

    useEffect(() => {
        if (value.location_string) {
            setValue(value);
            setSelectionMade(true);
        }
    }, [value.location_string]);

    useEffect(() => {
        // clear field in filter
        if (!value.location_string && !field.value) {
            setTerm("");
        }

    }, [field.value]);

    const setValue = (value) => {
        formContext?.setValue(name, value.location_string);
        formContext?.setValue(name + '_country', value.country);
        formContext?.setValue(name + '_state', value.state);
        formContext?.setValue(name + '_city', value.city);
        formContext?.setValue(name + '_zip', value.zip);
        formContext?.setValue(name + '_lat', value.lat);
        formContext?.setValue(name + '_lng', value.lng);
        formContext?.setValue(name + '_street', value.street);
        formContext?.setValue(name + '_street_number', value.street_number);

        onChange?.({
            location_string: value.location_string,
            lat: value.lat,
            lng: value.lng,
            street: value.street,
            street_number: value.street_number,
            city: value.city,
            state: value.state,
            country: value.country,
            zipCode: value.zip,
        });
        setTerm(value.location_string);
    }

    const onSelect = async (placeId) => {
        try {
            const res = await fetcher(`/api.php?goo=place&place_id=${placeId}`);
            setValue(res);
            setSelectionMade(true);

        } catch (err) {
            console.warn('Error fetching details:', err);
        }
        clearSearch();
    };

    return (
        <Field classes="z-50" {...props}>
            <InputRef
                placeholder="Start typing your address"
                value={term}
                onChangeText={text => {
                    setTerm(text);
                    setSelectionMade(false);
                }}
            />
            {searchError && <Text>Error</Text>}
            {(!selectionMade && locationResults.length > 0) && (
                <View className="absolute z-50  w-full max-w-md top-14 p-1 z-50 rounded-xl border-bdr dark:border-bdr-d border bg-card backdrop-blur-xl p-1">
                    {locationResults.slice(0, 5).map(item => (
                        <Button
                            key={item.place_id}
                            startDecorator="MapPin"
                            variant="text"
                            fullWidth
                            align="left"
                            size="xs"
                            title={item.description}
                            onPress={() => onSelect(item.place_id)}
                        />
                    ))}

                </View>
            )}
        </Field>
    );
}