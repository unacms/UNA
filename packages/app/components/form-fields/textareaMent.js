import Field from './_field';
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useController } from 'react-hook-form';
import { useState, useEffect} from 'react';
import { fetcher } from 'app/lib/fetcher';
import { replaceMentionValues } from 'react-native-controlled-mentions';
import { MentionInput as MentionInputDef } from 'react-native-controlled-mentions'
import { styled } from 'nativewind'
import { Theme } from 'app/design/theme';

const MentionInput = styled(MentionInputDef, ' bg-bgrinput  border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-base leading-5 h-[40px]')
const MentionInputMulti = styled(MentionInputDef, ' bg-bgrinput text-neutral-900 border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-base leading-5')
const MentionInputMultiTransparent = styled(MentionInputDef, '  text-red-500 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-200 text-base leading-5 text-neutral-800')

function formatText(text) {
    let v =  text.replace(/<\/?p>/g, '\n').trim();
    v =  v.replace(/&nbsp;/g, ' ').trim();
    v = v.replace(
        /<a(.*?)class="bx-mention-link(.*?)"[^>]*>([^<]+)<\/a>/g,
        (match, p1, p2, name) => {
            //console.log('Name:', name);
            const trigger = '@'; // Assuming '@' is the trigger in this context
            //console.log('Trigger:', trigger, name);
            name = name.replace('@', '');
            return `@[${name}](7)`; // Replace '8' with the appropriate ID if needed
        }
    );
    return v;
}

export default function ({ name, value = '', numLines = 4, ...props }) {

    const { colors } = Theme();
    const { field } = useController({ name, rules: {}, defaultValue: value });

    const [localValue, setLocalValue] = useState(formatText(field.value));
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
        else{
            setLocalValue(formatText(field.value));
        }
    }, [field.value]);    

    const handleChange2 = (val) => {
        setLocalValue(val);
        
        let v = replaceMentionValues(val, ({trigger, name, id}) => `<a class="bx-mention-link" href="/pages/view-persons-profile?id=${id}" title="${name}" dchar="${trigger}" data-profile-id="${id}">${name}</a>`)
        v = v.split('\n').map(line => `<p>${line}</p>`).join('');
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

    let styles ={maxHeight: 100, verticalAlign:'top'};
    if(name != 'cmt_text') {
        styles = {...styles, minHeight: 100}
    }

    if (typeof props.styles === 'object')
        styles = {...styles, ...props.styles};

    let MentionInput = props.bg =='transparent' ? MentionInputMultiTransparent : MentionInputMulti
    
    return (
        <Field {...props}>
            <MentionInput style={styles}
                multiline
                autoFocus={field.value ? true : false}
                value={localValue}
                placeholder = {props.placeholder}
                onChange={handleChange2}
                partTypes={[
                    {
                        trigger: '@', 
                        renderSuggestions: (params) => renderSuggestions({...params, trigger: '@'}),
                        textStyle: {fontWeight: 'bold', color: colors.primary}, 
                    },
                    {
                        trigger: '#', 
                        renderSuggestions: (params) => renderSuggestions({...params, trigger: '#'}),
                        textStyle: {fontWeight: 'bold', color: colors.primary}, 
                    },
                ]}
            />
        </Field>
    );
}
