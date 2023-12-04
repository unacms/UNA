import Field from './_field';
import {Text} from 'app/design/typography'
//import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
//import Autocomplete from "react-google-autocomplete";
//import { ReactOsmGeocoding } from '@paraboly/react-osm-geocoding'
//import Geosuggest from '@ubilabs/react-geosuggest';
//import '@paraboly/react-osm-geocoding/dist/index.css' 
//AIzaSyDucslZsW9Lx-C5siKKjw2SD2_tHKc1oE8
//    "react-native-google-places-autocomplete": "^2.5.6",
//import Autocomplete from "react-google-autocomplete";
import { usePlacesWidget } from "react-google-autocomplete";
import { Input } from 'app/design/controls'
import { useState, } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { appSetting } from 'app/lib/util'

export default function FormFieldLocation(props) {

    const formContext = useFormContext();
    let name = props.name;
    let rules = {};
    let defaultValue = props.value ? props.value : '';
    const [place, setPlace] = useState(defaultValue);

    const { ref } = usePlacesWidget({
        options: {
            types: ["geocode", "establishment"],
            language:'en',
           
        },
        apiKey: appSetting('api_keys', 'google_maps'),

        language:'en',
        onPlaceSelected: (place) => {
            parseAdd(place)
          
        }
    })

    const parseAdd = (place) =>
    {
        let country = null;
        let state = null;
        let zipCode = null;

        let city = null;
        let street = null;
        let street_number = null;

        let lat = null;
        let lng = null;
    
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

        formContext.setValue(name + '_country', country);
        formContext.setValue(name + '_state', state);
        formContext.setValue(name + '_city', city);
        formContext.setValue(name + '_zip', zipCode);
        formContext.setValue(name + '_lat', lat);
        formContext.setValue(name + '_lng', lng);
        formContext.setValue(name + '_street', street);
        formContext.setValue(name + '_street_number', street_number);
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
            />
        </Field>
    );
}
