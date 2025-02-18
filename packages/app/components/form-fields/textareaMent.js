import Field from './_field';
import { View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useController } from 'react-hook-form';
import { useState, useRef, useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { MentionInput as MentionInputDef, replaceMentionValues } from 'react-native-controlled-mentions'
import { Theme } from 'app/design/theme';
import { Platform } from 'react-native'

export const MentionInput = ({ className, ...props }) => (
    <MentionInputDef className={'bg-bgrinput border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-[16px] leading-[22px] h-[40px]'} {...props} />
);

export const MentionInputMulti = ({ className, ...props }) => (
    <MentionInputDef className={'bg-bgrinput text-neutral-900 border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-[16px] leading-[22px]'} {...props} />
);

export const MentionInputMultiTransparent = ({ className,  ...props }) => {
    return(
    
    <MentionInputDef style={{
        borderColor: 'gray',
        borderWidth: 1,
        height: '22px',
        padding: 0,
        borderRadius: 5,
    }}  {...props} />
)};

function formatText(text) {
    //TODO REPLACE TO BR
    // let v =  text.replace(/<\/?p>/g, '\n').trim();
    let v = text.replace(/<br>/g, '\n');
    v = v.replace(
        /<a[^>]*href="([^"]+)"[^>]*class="bx-mention-link[^"]*"[^>]*>([^<]+)<\/a>/g,
        (match, href, name) => {
            return `@[${name}](${href})`; // Используем name и href без лишних манипуляций
        }
    );
    v = v.replace(
        /<a[^>]*class="[^"]*\bbx-mention-link\b[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
        (match, href, name) => {
            return `@[${name}](${href})`;
        }
    );
    /*v = v.replace(
        /<a\b(?=[^>]*\bclass="[^"]*\bbx-mention-link\b")(?=[^>]*\bhref="([^"]+)")[^>]*>([^<]+)<\/a>/gi,
        (match, href, name) => {
          return `@[${name}](${href})`;
        }
      );*/
    v = v.replace(/<p>/g, '\n');

    // Remove </p>
    v = v.replace(/<\/p>/g, '');



    // Remove first \n if it exists
    if (v.startsWith('\n')) {
        v = v.slice(1);
    }

    // Remove last \n if it exists
    /* if (v.endsWith('\n')) {
         v = v.slice(0, -1);
     }*/

    return v;
}

export default function ({ name, value = '', numLines = 4, ...props }) {
    const isIos = Platform.OS == 'ios'
    const inputRef = useRef(null);
    const { colors } = Theme();
    const { field } = useController({ name, rules: {}, defaultValue: value });
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
        if (inputRef.current && props.autofocus) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 300); 
        }
    }, [props.autofocus]);
    const handleChange2 = (val) => {
        let v = replaceMentionValues(val, ({ trigger, name, id }) => `<a class="bx-mention-link" href="${id}" title="${name}" dchar="${trigger}" data-profile-id="${id}">${name}</a>`)
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
                        style={{ padding: 12 }}
                    >
                        <Text>{one.name}</Text>
                    </Pressable>
                ))}
            </View>
        );
    };


    let styles = {
        fontSize: props.fontSize || 16,
        lineHeight: props.lineHeight || 20,
        color: colors.text,
        ...(isIos ? {  paddingVertical: 4 } : { }),
        ...(name !== 'cmt_text' ? {  } : { maxHeight: 160 }),/*minHeight: 160*/
        ...(props.maxHeight ? { maxHeight: props.maxHeight } : {})
    };

    if (props.maxHeight) {
        styles.maxHeight = props.maxHeight;
    }

    if (typeof props.styles === 'object')
        styles = { ...styles, ...props.styles };

    let MentionInput = props.bg == 'transparent' ? MentionInputMultiTransparent : MentionInputMulti
    let ft = formatText(field.value);

    return (
            <MentionInput style={styles}
                inputRef={(ref) => {
                    if (ref) {
                        inputRef.current = ref;
                        const originalFocus = ref.focus;
                        ref.focus = (...args) => {
                            if (props.onFocus) {
                                props.onFocus();
                            }
                            if (originalFocus) {
                                originalFocus.apply(ref, args); 
                            }
                        };
                    }
                }}
                multiline
                allowFontScaling={false}
                autoFocus={field.value ? true : false}
                value={ft}
                placeholder={props.placeholder}
                onChange={handleChange2}
                partTypes={[
                    {
                        trigger: '@',
                        renderSuggestions: (params) => renderSuggestions({ ...params, trigger: '@' }),
                        textStyle: { fontWeight: 'bold', color: colors.primary },
                    },
                    {
                        trigger: '#',
                        renderSuggestions: (params) => renderSuggestions({ ...params, trigger: '#' }),
                        textStyle: { fontWeight: 'bold', color: colors.primary },
                    },
                ]}
            />

    );
}
