import CheckBox from 'app/ui/atoms/checkbox';
import { Row, View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useMemo, useState } from 'react';
import { NeoButton, Input } from "app/design/controls";
import RadioButton from 'app/ui/atoms/radiobutton';
import { useTranslation } from 'react-i18next';

const itemId = (item) => (item.key !== undefined && item.key !== null ? item.key : item.value);
const itemTitle = (item) => item.label ?? item.value;
const itemSearchText = (item) => {
    if (typeof item.label === 'string') return item.label;
    if (typeof item.value === 'string') return item.value;
    return '';
};

export default function ({
    values,
    selectedValue,
    setValue,
    multi = true,
    showApply = true,
    searchable = false,
}) {
    const { t } = useTranslation();
    const selected = Array.isArray(selectedValue) ? selectedValue : [];
    const [internal, setInternal] = useState(selected);
    const [query, setQuery] = useState('');
    const value2 = showApply ? internal : selected;

    const addValue2 = (id) => {
        const selectedValues = value2.includes(id)
            ? value2.filter(item => item !== id)
            : multi ? [...value2, id] : [id];
        if (showApply) setInternal(selectedValues);
        else setValue(selectedValues);
    }

    const filteredValues = useMemo(() => {
        if (!searchable || !query) return values;
        const needle = query.toLowerCase();
        return values?.filter(item => itemSearchText(item).toLowerCase().includes(needle));
    }, [searchable, query, values]);

    const Control = multi ? CheckBox : RadioButton
    return (
        <View>
            {searchable ? (
                <View className='pb-2'>
                    <Input
                        name="search"
                        placeholder={t('Search...')}
                        onChangeText={setQuery}
                    />
                </View>
            ) : null}
            {
                filteredValues?.map((item2, index) => {
                    const id = itemId(item2);
                    return (
                        <Row key={`rb-${index}`} className='items-center'>
                            {id || id === 0 ? <>
                                <Control
                                    value={id}
                                    status={value2.includes(id) ? 'checked' : 'unchecked'}
                                    onPress={() => { addValue2(id); }}
                                    title={itemTitle(item2)}
                                    icon={item2?.icon}
                                />
                            </> : <Text className="text-secondary-foreground  text-sm font-semibold mt-4 mb-2">{item2.label}</Text>}
                        </Row>
                    )
                })
            }
            {showApply ? (
                <View className='flex-row justify-end pt-3 mt-3 border-t border-border/60 '>
                    <NeoButton
                        style="borderedProminent"
                        disabled={value2.length === 0}
                        label={t('Apply')}
                        onPress={() => setValue(value2)}
                    />
                </View>
            ) : null}
        </View >
    )
}
