import { View, Row } from 'app/design/view'
import Dropdown from 'app/ui/atoms/dropdown'
import { useState, useReducer, useMemo, useCallback, useEffect } from 'react';
import { Modal } from 'app/design/controls'
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';

const formatValueDate = (v) => {
    const date = new Date(v.dt);
    const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return localDate.toLocaleDateString();
}

const formatValue = (v, bIsTime) => {
    if (v.dt != '') {
        let v3 = formatValueDate(v);
        if (bIsTime)
            return `${v3} ${v.h}:${v.m}`
        else
            return v3;
    }
    else {
        return bIsTime ? 'Select date/time' : 'Select date';
    }
}

const setdValue_ = (state, action) => {
    return { ...state, [action.type]: action.value };
}

const loadCalendar = async (setDynamicCalendar) => {
    const Calendars = await import('react-native-calendars');
    setDynamicCalendar(() => Calendars.Calendar);
};

const CalendarHeader = (dValue, addMonth) => (
    <Row className='w-full justify-between mb-4 items-center mt-2'>
        <Button size="sm" rounded startDecorator="CaretDoubleLeft" onPress={() => addMonth('y', -1)} />
        <Button size="sm" rounded startDecorator="CaretLeft" onPress={() => addMonth('m', -1)} />
        <Text className=" font-medium text-neutral-700 text-lg">{formatValueDate(dValue)}</Text>
        <Button size="sm" rounded startDecorator="CaretRight" onPress={() => addMonth('m', 1)} />
        <Button size="sm" rounded startDecorator="CaretDoubleRight" onPress={() => addMonth('y', 1)} />
    </Row>
);

const generateValues = range => Array.from({ length: range }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }));

export default function ({ name, value = '', type, onChange }) {
    const { colors } = Theme();
    const bIsTime = type === 'datetime';
    const [showModal, setShowModal] = useState(false);
    const [DynamicCalendar, setDynamicCalendar] = useState(null);
    
    const [date, hour = '00', minute = '00'] = value.split(/[: ]/);
    const [dValue, setdValue] = useReducer(setdValue_, { dt: date, h: hour, m: minute });
    const [cValue, setcValue] = useState({ dt: date, h: hour, m: minute });

    useEffect(() => {
        let isMounted = true;
        loadCalendar(setDynamicCalendar).catch(console.error).then(() => {
            if (!isMounted) setDynamicCalendar(null);
        });
        return () => { isMounted = false; };
    }, []);

    const setFieldValue = (val, hide = true) => {
        setcValue(val)
        onChange((new Date(`${val.dt} ${val.h}:${val.m}`).getTime()) / 1000)
        if (hide)
            setShowModal(false);
    }

    const setValueDay = (day, hide = true) => {
        setdValue({ type: 'dt', value: day.dateString })
        if (!bIsTime) {
            setFieldValue({ dt: day.dateString, h: dValue.h, m: dValue.m }, hide);
        }
    };

    const addMonth = (type, val) => {
        let newDate = new Date(dValue.dt);
        if (type === 'y')
            newDate.setFullYear(newDate.getFullYear() + val);
        if (type === 'm')
            newDate.setMonth(newDate.getMonth() + val);

        setValueDay({ dateString: newDate.toISOString().slice(0, 10) }, false)
    };

    const hours = useMemo(() => generateValues(24), []);
    const minutes = useMemo(() => generateValues(60), []);

    return (
        <>
            <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
                <View className='  max-w-sm w-full mx-auto'>
                    <View className='  max-w-sm w-full mx-auto aspect-square '>
                        {DynamicCalendar && <DynamicCalendar
                            className=' bg-bgrcard dark:bg-bgrcard-d'
                            theme={{
                                calendarBackground: colors.background2,
                                dayTextColor: colors.text,
                                textDisabledColor: colors.text,
                                monthTextColor: colors.text,
                            }}
                            renderArrow={direction => { return <View className="text-neutral-800 dark:text-neutral-200"><Icon icon={direction == 'left' ? 'ArrowLeft' : 'ArrowRight'} width={24} height={24} /></View> }}
                            initialDate={dValue.dt}
                            customHeader={() => CalendarHeader(dValue, addMonth)}
                            onDayPress={day => {
                                setValueDay(day)
                            }}
                            markedDates={{
                                [dValue.dt]: { selected: true, selectedColor: colors.primary }
                            }}
                        />}
                    </View>

                    {
                        bIsTime && (<View className='w-full justify-center items-center gap-y-4'><Row className='justify-center items-center w-64 mt-2'>
                            <Text className="text-base justify-center items-center text-neutral-900 dark:text-neutral-50"> Time </Text>
                            <View>
                                <Dropdown
                                    labelField="label"
                                    valueField="value"
                                    onChange={(v) => setdValue({ type: 'h', value: v })}
                                    value={dValue.h}
                                    data={hours}
                                />
                            </View>
                            <Text className="text-base justify-center items-center text-neutral-900 dark:text-neutral-50"> : </Text>
                            <View>
                                <Dropdown
                                    labelField="label"
                                    valueField="value"
                                    onChange={(v) => setdValue({ type: 'm', value: v })}
                                    value={dValue.m}
                                    data={minutes}
                                />
                            </View>
                        </Row>
                            <Button title="Apply" onPress={() => { setFieldValue(dValue) }} />
                        </View>
                        )
                    }
                </View>
            </Modal>
            <Row>
                <Button title={formatValue(cValue, bIsTime)} endDecorator="Calendar" onPress={() => { setShowModal(true) }} />
            </Row>
        </>
    );
}
