import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import React, { useState } from 'react';
import { Switch } from 'app/design/controls'
import { Theme } from 'app/design/theme';
import { fetcher } from 'app/lib/fetcher';
import { Button } from 'app/design/controls'
import { firstLetterCap } from 'app/lib/util';
import { useTranslation } from 'react-i18next';

export default function (props) {
    const { colors } = Theme();
    const [activeIndex, setActiveIndex] = useState(0);
    let aData = [];
    const { t } = useTranslation();
    props.data.data.forEach((item, index) => {
        let aItems = [];
        item.items.forEach((item2, index) => {
            if (typeof item2 === 'string') {
                aItems.push({ type: 'header', title: item2 });
            }
            else {
                aItems.push({ type: 'item', title: item2.title.value, value: item2.switcher.data, id: item2.checkbox.data });
            }
        });
        aData.push({ title: item.delivery, items: aItems })
    })
    const [data, setData] = useState(aData);

    const toggleSwitch = (id, value) => {
        fetcher(props.request_url + JSON.stringify({ id, value }));



        setData(prevData => prevData.map((item, index) => index === activeIndex ? {
            ...item,
            items: item.items.map(item => item.id === id ? { ...item, value: item.value === 1 ? 0 : 1 } : item)
        } : item));
    }

    return <>
        <Row className='p-2'>
            {
                data.map((item, index) => {
                    return <View className='mr-2' key={'tab' + index}><Button
                        variant={index == activeIndex ? 'outline' : "text"}
                        pressed={index == activeIndex ? true : false}
                        title={t(firstLetterCap(item.title))}
                        rounded
                        size='sm'
                        onPress={() => setActiveIndex(index)}
                    /></View>
                })
            }
        </Row>
        {
            data[activeIndex].items.map((item, index) => {
                if (item.type == 'header') {
                    return (<Row className='p-2' key={"row" + index}>
                        <Text className="text-neutral-900 dark:text-neutral-100 text-sm font-semibold">{item.title}</Text>
                    </Row>)
                }
                else {
                    return (
                        <Row className='px-2 py-1' key={"row" + index}>
                            <Switch
                                trackColor={{ false: colors.border, true: colors.checkbox }}
                                thumbColor={'#ffffff'}
                                onValueChange={() => toggleSwitch(item.id, item.value == 1 ? 0 : 1)}
                                activeThumbColor={'#ffffff'}
                                value={item.value == 1 ? true : false}
                                ios_backgroundColor={colors.background}
                            />
                            <Text className="ml-2 text-neutral-900 dark:text-neutral-100 text-sm">{item.title}</Text>
                        </Row>
                    )
                }
            })
        }
    </>
}