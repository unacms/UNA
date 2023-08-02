import Field from './_field';
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useController } from 'react-hook-form';
import { useState, useEffect} from 'react';
import { fetcher } from '../../lib/fetcher';
import { replaceMentionValues } from 'react-native-controlled-mentions';
import { MentionInput as MentionInputDef } from 'react-native-controlled-mentions'
import { styled } from 'nativewind'

const MentionInput = styled(MentionInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5 h-[42px]')
const MentionInputMulti = styled(MentionInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5')

export default function FormFieldText({ name, value = '', numLines = 4, ...props }) {
    const { field } = useController({ name, rules: {}, defaultValue: value });
    const [localValue, setLocalValue] = useState(field.value);
    const [suggestions, setSuggestions] = useState([]);
    const [keywordval, setKeyword] = useState(['', '']);

    useEffect(() => {
        if (keywordval[0] === '') return;
        
        const fetchData = async () => {
            let url = `/searchExtended.php?action=get_mention&symbol=${keywordval[1] === '#' ? '%23' : '%40'}&term=${keywordval[0]}`;
            const result = await fetcher(url); 
            let p = result.map(k => ({ id: k.value, name: k.label }));
            
            setSuggestions(p);
        };

        fetchData();
    }, [keywordval]);

    useEffect(() => {
        if (field.value == ''){
            setLocalValue('');
        }
    }, [field.value]);    

    const handleChange2 = (val) => {
        setLocalValue(val);
        
        let v = replaceMentionValues(val, ({trigger, name, id}) => `<a class="bx-mention-link" href="/pages/view-persons-profile?id=${id}" title="${name}" dchar="${trigger}" data-profile-id="${id}">${trigger}${name}</a>`)
        field.onChange(v)
    }

    const renderSuggestions = ({ keyword, onSuggestionPress, trigger }) => {
        if (keyword == null) {
            return null;
        }
        if (keyword != keywordval[0] || trigger != keywordval[1])
            setKeyword([keyword, trigger]);

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

    let styles ={maxHeight: 100};
    if(name != 'cmt_text') {
        styles = {...styles, minHeight: 100}
    }

    return (
        <Field {...props}>
            <MentionInputMulti style={styles}
                multiline
                value={localValue}
                onChange={handleChange2}
                partTypes={[
                    {
                        trigger: '@', 
                        renderSuggestions: (params) => renderSuggestions({...params, trigger: '@'}),
                        textStyle: {fontWeight: 'bold', color: 'blue'}, 
                    },
                    {
                        trigger: '#', 
                        renderSuggestions: (params) => renderSuggestions({...params, trigger: '#'}),
                        textStyle: {fontWeight: 'bold', color: 'blue'}, 
                    },
                ]}
            />
        </Field>
    );
}
