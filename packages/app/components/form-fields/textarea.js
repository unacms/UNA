import Field from './_field';
import FormFieldFtf from './rtf';
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useController, useFormContext } from 'react-hook-form';
import { MentionInput, MentionInputMulti } from 'app/design/controls'
import { useState, useRef, useEffect  } from 'react';
import { fetcher } from '../../lib/fetcher';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
export default function FormFieldText(props) {
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    const [height, setHeight] = useState(null);
    const editorRef = useRef(null);
    const [value, setValue] = useState(defaultValue)

    //if (value != field.value)
    //  setValue(field.value);

    setTimeout(() => {
      formContext.setValue(props.name, value)
    }, 100);

    const [suggestions, setSuggestions] = useState([]);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
    const fetchData = async () => {
      const result = await fetcher('/searchExtended.php?action=get_mention&symbol=%40&term='+keyword); // keyword


      let p=[];
      result.forEach(function (k) { 
        p.push( {id: k.value, name: k.label})
      });
      setSuggestions(p);
    };
    if (keyword !='')
      fetchData();
    
  }, [keyword]);
      
      const renderSuggestions  =  ({ keyword, onSuggestionPress }) => {

        if (keyword == null) {
          return null;
        }
        setKeyword(keyword)

        return (
         
          
          <View>
            {suggestions.map(one => (
          <Pressable
          key={one.id}
          onPress={() => onSuggestionPress(one)}

          style={{padding: 12}}
        >
          <Text>{one.name}</Text>
        </Pressable>
          ))}
            
          </View>
        );
      };

      const handleChange =  async () => {
        
    }  

    let input = <MentionInputMulti
        multiline

        numberOfLines={props.numLines ? props.numLines : 4}
       
        value={value}
        onChange={setValue}
      
        partTypes={[
          {
            trigger: '@', // Should be a single character like '@' or '#'
            renderSuggestions,
            textStyle: {fontWeight: 'bold', color: 'blue'}, // The mention style in the input
          },
        ]}
    />

   

    if (props.autoheight)
        input = <MentionInput
           

        value={value}
        onChange={setValue}
      
        partTypes={[
          {
            trigger: '@', // Should be a single character like '@' or '#'
            renderSuggestions,
            textStyle: {fontWeight: 'bold', color: 'blue'}, // The mention style in the input
          },
        ]}
        />

       

    if (props.html == 2){
     //   input =  <></>;
    }    

    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
    });

    return (
        <Field {...props}>
          <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 500 })}
        >
            {input}
          </KeyboardAvoidingView>
        </Field>
    );
}
