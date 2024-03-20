
import { useEffect } from 'react';
import { View, Row } from 'app/design/view'
import Dropdown from 'app/ui/atoms/dropdown'
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';


export default function ({ name, value = '', type, onChange }) {
    const bIsTime = type === 'datetime';

    const formatValue = (v) => {
        if (v.dt != '') {
            let v3 = (new Date(v.dt)).toLocaleDateString();
            if (bIsTime)
                return `${v3} ${v.h}:${v.m}`
            else
                return v3;
        }
        else {
            return bIsTime ? 'Select date/time' : 'Select date';
        }
    }

    const [DynamicCalendar, setDynamicCalendar] = useState(null);

    useEffect(() => {
        import('react-native-calendars').then((Calendars) => {
            setDynamicCalendar(() => Calendars.Calendar);
        });
    }, []);

    const [showModal, setShowModal] = useState(false);


    const [date, time] = value.split(' ');

    let [hour = '00', minute = '00'] = time ? time.split(':') : [];

    const [dValue, setdValue] = useState({ dt: date, h: hour, m: minute });
    const [valueh, setValueh] = useState(hour);
    const [valuem, setValuem] = useState(minute);

    useEffect(() => {
        setValueh(dValue.h);
        setValuem(dValue.m);
    }, [dValue]);

    const { colors } = Theme();

    const generateValues = (range) => {
        let values = [];
        for (let i = 0; i < range; i++) {
            let item = i.toString().padStart(2, '0');
            values.push({ label: item, value: item });
        }
        return values;
    }

    const valuesh = generateValues(24);
    const valuesm = generateValues(60);

    const setValue = (val, hide = true) => {
        onChange((new Date(`${val.dt} ${val.h}:${val.m}`).getTime()) / 1000)
        if (hide)
            setShowModal(false);
    }
    const setValueDay = (day, hide = true) => {
        console.log("day", day)
        if (bIsTime) {
            setdValue({ dt: day.dateString, h: dValue.h, m: dValue.m })
        }
        else {
            setdValue({ dt: day.dateString, h: dValue.h, m: dValue.m });
            setValue({ dt: day.dateString, h: dValue.h, m: dValue.m }, hide);
        }
    }

    const setTime1 = (v) => setdValue(prev => ({ ...prev, h: v }));
    const setTime2 = (v) => setdValue(prev => ({ ...prev, m: v }));

    const addMonth = (type, val) => {
        let newDate = new Date(dValue.dt);
        if (type === 'y')
            newDate.setFullYear(newDate.getFullYear() + val);
        if (type === 'm')
            newDate.setMonth(newDate.getMonth() + val);

        setValueDay({ dateString: newDate.toISOString().slice(0, 10) }, false)
    };

    const CalendarHeader = (props) => {
        return <Row className='w-full justify-between mb-4 items-center mt-2'>

                <Button size="sm" rounded startDecorator="CaretDoubleLeft" onPress={() => addMonth('y', -1)}/>
                <Button size="sm" rounded startDecorator="CaretLeft" onPress={() => addMonth('m', -1)}/>
           
            <Text className="font-font-medium text-neutral-700 text-lg">{new Date(dValue.dt).toLocaleDateString()}</Text>

            <Button size="sm" rounded startDecorator="CaretRight" onPress={() => addMonth('m', 1)}/>
                <Button size="sm" rounded startDecorator="CaretDoubleRight" onPress={() => addMonth('y', 1)}/>

        </Row>
    }
    return (
        <>
            <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} outerClickClose={true} transparent={false}>
                <View className='  max-w-sm w-full mx-auto aspect-square'>
                    {DynamicCalendar && <DynamicCalendar
                        className=' bg-bgrcard dark:bg-bgrcard-d'
                        theme={{

                            calendarBackground: colors.background2,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.text,
                            monthTextColor: colors.text,
                        }}
                        renderArrow={direction => { return <View className="text-neutral-800 dark:text-neutral-200"><Icon icon={direction == 'left' ? 'ArrowLeft' : 'ArrowRight'} width={24} height={24} /></View> }}
                        initialDate={date}
                        customHeader={CalendarHeader}
                        onDayPress={day => {
                            setValueDay(day)
                        }}
                        markedDates={{
                            [dValue.dt]: { selected: true, selectedColor: colors.primary }
                        }}
                    />}
                    <View className='w-full justify-center items-center gap-y-4'>
                        {
                            bIsTime && (<><Row className='justify-center items-center w-64 mt-2'>
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
                            </Row>
                                <Button title="Apply" onPress={() => { setValue(dValue) }} />
                            </>
                            )
                        }


                    </View>
                </View>
            </Modal>
            <Row>
                <Button title={formatValue(dValue)} endDecorator="Calendar" onPress={() => { setShowModal(true) }} />
            </Row>
        </>
    );
}
