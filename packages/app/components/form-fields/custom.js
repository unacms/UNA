import React, {useState, useEffect} from 'react';

import {
    SafeAreaView,
    View,
    FlatList,
    StyleSheet,
    Text,
    StatusBar,
  } from 'react-native';

  import Autocomplete from 'react-native-autocomplete-input';

export default function FormFieldCustom(props) {
    //if (props.name != 'source')
        return <></>
    return (
        <Field {...props}>
            <Text>TODO: {props.name}</Text>
           
          

        </Field>
    );
}
