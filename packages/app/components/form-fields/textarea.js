import Field from './_field';
import FormFieldFtf from './rtf';
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { useState, useRef, useEffect  } from 'react';
import { MentionInput } from 'react-native-controlled-mentions'
import { fetcher } from '../../lib/fetcher';

export default function FormFieldText(props) {
    
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    
    const formContext = useFormContext();
    const { field } = useController({ name, rules, defaultValue });
    const [height, setHeight] = useState(null);
    const editorRef = useRef(null);
    const [value, setValue] = useState(defaultValue)

    setTimeout(() => {
      formContext.setValue(props.name, value)
  }, 100);

   /* const suggestions = [
        {id: '1', name: 'David Tabaka'},
        {id: '2', name: 'Mary'},
        {id: '3', name: 'Tony'},
        {id: '4', name: 'Mike'},
        {id: '5', name: 'Grey'},
      ];*/

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
      
  console.log(999)
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

    let input = <MentionInput
        multiline
        editable
        numberOfLines={props.numLines ? props.numLines : 4}
        name={props.name}
        onChangeText={field.onChange}
        onBlur={field.onBlur}
        value={field.value}
        onChange={handleChange}
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
        input =  <></>;
    }    

    return (
        <Field {...props}>{input}</Field>
    );
}
