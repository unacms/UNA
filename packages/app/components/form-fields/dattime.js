import Field from './_field';
import { useEffect } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { View, Row } from 'app/design/view'
//import { Calendar } from 'react-native-calendars';
import Dropdown from 'app/ui/atoms/dropdown'
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { Hidden } from 'app/design/controls'

export default function FormFieldDattime({ name, value = '', type, ...props }) {
    const [DynamicCalendar, setDynamicCalendar] = useState(null);

    useEffect(() => {
        import('react-native-calendars').then((Calendars) => {
            setDynamicCalendar(() => Calendars.Calendar);
        });
    }, []);

    const formContext = useFormContext();
    const rules = {};
    const { field } = useController({ name, rules, defaultValue: value });

    const [showModal, setShowModal] = useState(false);
    const bIsTime = type === 'datetime';

    const [date, time] = field.value.replace('Z', '').split(' ');
    let [hour = '', minute = ''] = time ? time.split(':') : [];
    
    const [dValue, setdValue] = useState({ dt: date, h: hour, m: minute });

    // Value for dropdowns
    const [valueh, setValueh] = useState(hour);
    const [valuem, setValuem] = useState(minute);

    useEffect(() => {
        setValueh(dValue.h);
        setValuem(dValue.m);
    }, [dValue]);

    const { colors } = Theme();

    const generateValues = (range) => {
        let values = [];
        for(let i = 0; i < range; i++) {
            let item = i.toString().padStart(2, '0');
            values.push({ label: item, value: item });
        }
        return values;
    }

    const valuesh = generateValues(24);
    const valuesm = generateValues(60);

    const setValue = () => {
        setTimeout(() => {
            formContext.setValue(name, `${dValue.dt} ${dValue.h}:${dValue.m}:00Z`);
        }, 100);
        setShowModal(false);
    }

    const setTime1 = (v) => setdValue(prev => ({ ...prev, h: v }));
    const setTime2 = (v) => setdValue(prev => ({ ...prev, m: v }));

    return (
        <Field {...props}>
            <Modal title={"Select date" + (bIsTime ? '/time' : '')} onVisible={!!showModal} onClose={() => {setShowModal(false)}} outerClickClose={false} transparent={false}>
                    {DynamicCalendar && <DynamicCalendar 
                        className=' bg-bgrcard dark:bg-bgrcard-d'
                        theme={{
                            calendarBackground: colors.background2,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.border,
                            monthTextColor: colors.text,
                        }}
                        renderArrow={direction => {return  <Icon icon={direction} width={24} height={24} />}}
                        initialDate = {date}
                        onDayPress={day => {
                            setdValue({dt:day.dateString, h:dValue.h, m:dValue.m})
                        }}
                        markedDates={field.value != '' ?{
                            [dValue.dt]: {selected: true, selectedColor: colors.primary}
                        } : {
                            [dValue.dt]: {selected: true}
                        }}
                    />}
                    <View className='w-full justify-center items-center'>
                    {
                            bIsTime && (<Row className='justify-center items-center w-64 mt-2'>
                                <Text className="text-base justify-center items-center text-neutral-900 dark:text-neutral-50"> Time </Text>
                                <View>
                                    
                                    <Dropdown 
                                        labelField="label"
                                        valueField="value"
                                        onChange={setTime1}
                                        value={valueh}
                                        data={valuesh}
                                    />
                                </View>    
                                <Text className="text-base justify-center items-center text-neutral-900 dark:text-neutral-50"> : </Text>
                                <View>
                                    <Dropdown
                                        labelField="label"
                                        valueField="value"
                                        onChange={setTime2}
                                        value={valuem}
                                        data={valuesm}
                                    />
                                </View>
                        </Row>)
                        } 
                        <View className='mx-4 mt-2 w-full justify-end items-end'><Button title="Appply" onPress={() => { setValue(true) }}/></View>  
                    </View>
            </Modal>
            <Row>
                <View className='w-40 mr-2'>
                    <Hidden name={props.name} onBlur={field.onBlur} value={field.value} />
                    <Input value={date} readonly={true} />
                </View>
                <Button startDecorator="calendar" onPress={() => { setShowModal(true) }}/>
            </Row>
        </Field>
    );
}
