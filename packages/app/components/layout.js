import React from 'react';
import {
  View,
  KeyboardAvoidingView,
  TextInput,
  StyleSheet,

  Platform,
  TouchableWithoutFeedback,
  Button,
  Keyboard,
} from 'react-native';
import { Text } from 'app/design/typography'

export default function Layout(props) {
    let data =props.data;
    let isBrowse = false;
    let oComments=false;

    
    // TODO IMPROVE
    if (props.uri && props.uri.includes('view-post')){
        oComments = true;
    }

    Object.keys(data?.elements).forEach(key => {
        Object.keys(data.elements[key]).forEach(key2 => {
            Object.keys(data.elements[key][key2].content).forEach(key3 => {
                if(data.elements[key][key2].content[key3].type == 'browse'){
                    isBrowse = true;
                }
            });
        });
    });


    const sClassName = 'relative overflow-hidden ' + (oComments ? ' ' : '');

    const styles = StyleSheet.create({
        container: {
        
        },
        inner: {
          padding: 24,
         
          justifyContent: 'space-around',
        },
        header: {
          fontSize: 16,
          marginBottom: 48,
        },
        textInput: {
          height: 40,
          borderColor: '#000000',
          borderBottomWidth: 1,
          marginBottom: 36,
          backgroundColor:'red'
        },
        btnContainer: {
          backgroundColor: 'white',
          marginTop: 12,
        },
      });
      
      return (
        
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inner}>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <Text style={styles.header}>Header</Text>
              <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
              <TextInput  placeholder="Username" style={styles.textInput} />
              </KeyboardAvoidingView>
              <View style={styles.btnContainer}>
                <Button title="Submit" onPress={() => null} />
              </View>
            </View>
          </TouchableWithoutFeedback>
       
      );
}
