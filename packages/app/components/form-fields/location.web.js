import Field from './_field';
import {Text} from 'app/design/typography'
import { usePlacesWidget } from "react-google-autocomplete";
import { Input } from 'app/design/controls'
import { use, useState, } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { appSetting } from 'app/lib/util'
import { useEffect } from 'react'

export default function FormFieldLocation(props) {
    const formContext = useFormContext();
    let name = props.name;
    let rules = {};
    let defaultValue = props.value ? props.value : '';
    const [place, setPlace] = useState(defaultValue);
    
    useEffect(() => {
        if (formContext){
            formContext.setValue(name + '_country', props.value.country);
            formContext.setValue(name + '_state', props.value.state);
            formContext.setValue(name + '_city', props.value.city);
            formContext.setValue(name + '_zip', props.value.zip);
            formContext.setValue(name + '_lat', props.value.lat);
            formContext.setValue(name + '_lng', props.value.lng);
            formContext.setValue(name + '_street', props.value.street);
            formContext.setValue(name + '_street_number', props.value.street_number);
        }
    },[props.value]);

    const { ref } = usePlacesWidget({
        options: {
            types: ["geocode", "establishment"],
            language:'en',
           
        },
        apiKey: appSetting('config', 'api_keys', 'google_maps'),
        language:'en',
        onPlaceSelected: (place) => {
            parseAdd(place)
        }
    })



    const parseAdd = (place) =>
    {
        let country = '';
        let state = '';
        let zipCode = '';

        let city = '';
        let street = '';
        let street_number = '';

        let lat = '';
        let lng = '';

        place.address_components.forEach(component => {
            if (component.types.includes('country')) {
                country = component.short_name;
            } else if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;
            } else if (component.types.includes('postal_code')) {
                zipCode = component.long_name;
            } else if (component.types.includes('locality')) {
                city = component.long_name;
            } else if (component.types.includes('route')) {
                street = component.long_name;
            } else if (component.types.includes('street_number')) {
                street_number = component.long_name;
            }
        });
        lat = place.geometry.location.lat()
        lng = place.geometry.location.lng()
        
        if (formContext){
            formContext.setValue(name + '_country', country);
            formContext.setValue(name + '_state', state);
            formContext.setValue(name + '_city', city);
            formContext.setValue(name + '_zip', zipCode);
            formContext.setValue(name + '_lat', lat);
            formContext.setValue(name + '_lng', lng);
            formContext.setValue(name + '_street', street);
            formContext.setValue(name + '_street_number', street_number);
        }
        if (props.onChange) {
            props.onChange({ location_string: place.formatted_address, lat: lat, lng: lng, street: street, street_number: street_number, city: city, state: state, country: country, zipCode: zipCode })
        }
        
        setPlace({
            country: country, 
            state: state,
            city: city,
            zipCode: zipCode, 
            lat: lat,
            lng: lng,
            street: street, 
            street_number: street_number,
        })
    }

    return (
        <Field {...props}>   
            <Input 
                ref={ref} 
                defaultValue={defaultValue.location_string}   
                placeholder='Start typing your address'     
            />
        </Field>
    );
}
