import { View, Row, Pressable } from 'app/design/view'
import Dropdown from 'app/ui/atoms/dropdown'
import { useState, useReducer, useMemo, useCallback, useEffect } from 'react';
import { Modal } from 'app/design/controls'
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { TextInput as Input } from 'react-native'
import { formatDate } from 'app/lib/util'
import { useTranslation } from 'react-i18next';
const years = [];
for (let y = 1900; y <= 2100; y++) {
    years.push({ value: y });
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const months = monthNames.map((label, value) => ({ value, label }));

export function MonthCalendar({ date = new Date(), onSelect, selectedDate }) {
    // Year and month to display

    const displayYear = date.getFullYear();
    const displayMonth = date.getMonth() + 1;

    // Today's date for highlighting
    const today = new Date();

    // First day of the month and total days
    const firstOfMonth = new Date(displayYear, displayMonth - 1, 1);
    const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();
    const startWeekday = firstOfMonth.getDay(); // 0=Sun…6=Sat

    // Create array of 42 days (6 weeks)
    const cells = Array.from({ length: 42 }, (_, idx) => {
        const day = idx - startWeekday + 1;
        return day > 0 && day <= daysInMonth ? day : null;
    });

    const weeks = [];
    for (let i = 0; i < 6; i++) {
        weeks.push(cells.slice(i * 7, i * 7 + 7));
    }

    return (
        <View className="space-y-2 items-center">
            {weeks.map((week, wIdx) => (
                <View key={wIdx} className="flex-row ">
                    {week.map((day, dIdx) => {
                        const isToday = selectedDate ? (new Date(displayYear, displayMonth - 1, day)).toDateString() == selectedDate.toDateString() : null;

                        return (
                            <View
                                key={dIdx}
                                className="h-10 w-10 items-center justify-center"
                            >
                                {day && (
                                    <View
                                        className={`h-8 w-8 items-center justify-center rounded-full ${isToday ? 'bg-primary' : ''
                                            }`}
                                    >
                                        <Pressable onPress={() => { onSelect(new Date(displayYear, displayMonth - 1, day, selectedDate ? selectedDate.getHours() : 0, selectedDate ? selectedDate.getMinutes() : 0, selectedDate ? selectedDate.getSeconds() : 0)) }}>
                                            <Text
                                                className={` text-base ${isToday ? 'text-white' : 'text-neutral-700 dark:text-neutral-300'
                                                    }`}
                                            >
                                                {day}
                                            </Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const CalendarHeader = ({ value, addMonth, setDatePart }) => {

    const setY = (val) => {
        setDatePart('y', val);
    }

    const setM = (val) => {
        setDatePart('m', val);
    }
    return (
        <Row className='items-center gap-x-2 justify-center'>

            <Button rounded startDecorator="ChevronLeft" onPress={() => addMonth('m', -1)} />


            <View className='w-28'>
                <Dropdown labelField="label"
                    key={"year-dropdown1" + value}
                    valueField="value"
                    onChange={setM}
                    data={months}
                    value={value ? value.getMonth().toString() : ''}
                />
            </View>
            <View className='w-28'>
                <Dropdown labelField="value"
                    key={"year-dropdown" + value}
                    valueField="value"
                    onChange={setY}
                    data={years}
                    value={value ? value.getFullYear().toString() : ''}
                />
            </View>
            <Button rounded startDecorator="ChevronRight" onPress={() => addMonth('m', 1)} />
        </Row>
    )
};

const formatDateTime = (dateString) => {
    const [datePart, timePart] = dateString.replace('Z', '').split(' ');

    // Разбиваем компоненты даты и времени
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];

    // Создаем объект Date (месяцы в JavaScript отсчитываются от 0)
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

function getDatePart(date, part) {
    if (!(date instanceof Date))
        return '';
    const parts = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds(),
    };

    return parts[part]
}

export default function ({ name, value = '', type, onChange }) {

    const bIsTime = type === 'datetime';
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);
    const initValue = formatDateTime(value);
    const [dValue, setdValue] = useState(value ? initValue : null);
    const [cValue, setcValue] = useState(value ? initValue : new Date());
    const [tValue, settValue] = useState(value ? [String(initValue.getHours()).padStart(2, '0'), String(initValue.getMinutes()).padStart(2, '0')] : ['00', '00']);

    useEffect(() => {
        if (dValue)
            onChange((dValue.getTime()) / 1000)
    }, [dValue]);



    const addMonth = (type, val) => {
        setcValue(prev => {
            const next = new Date(prev.getTime());
            next.setMonth(next.getMonth() + val);
            return next;
        });
    };

    const setDatePart = (type, val) => {
        setcValue(prev => {
            const d = new Date(prev.getTime());
            if (type === 'm') d.setMonth(val);
            if (type === 'y') d.setFullYear(val);
            return d;
        });
    };

    const handleChangeTime = (text, maxValue, type) => {
        let filtered = text.replace(/[^0-9]/g, '');
        if (filtered !== '') {
            const num = parseInt(filtered, 10);
            filtered = num > maxValue
                ? String(maxValue)
                : String(num);
        }

        settValue(prev => {
            const j = [...prev];
            if (type === 'm') j[1] = filtered;
            if (type === 'h') j[0] = filtered;

            return j;
        });



    };

    const handleChangeTime2 = () => {
        if (dValue){
            setdValue(prev => {
                const d = new Date(prev.getTime());
                d.setMinutes(tValue[1]);
                d.setHours(tValue[0]);
                return d;
            });

            settValue(prev => {
                const j = [...prev];
                j[1] = String(prev[1]).padStart(2, '0');
                j[0] = String(prev[0]).padStart(2, '0');;

                return j;
            });
        }
    };

    const onSelectDate = (value) => {
        setShowModal(false)
        setdValue(value);
    }

   
    return (
        <>
            <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
                <View className='   w-full mx-auto'>
                    <View className='  w-full '>
                        <CalendarHeader value={cValue} addMonth={addMonth} setDatePart={setDatePart} />
                        <View className='mt-4'>
                            <MonthCalendar date={cValue} selectedDate={dValue} onSelect={onSelectDate} />
                        </View>

                    </View>
                </View>
            </Modal>
            <Row className='gap-3 p-1 items-center border/50 border border-border/60 web:border-0 web:ring-1 web:ring-inset web:ring-border/80 text-neutral-900 rounded-xl'>
                <Button title={`${dValue ? formatDate(dValue, t, {yearPolicy: 'always', month: 'numeric'}) : 'Select date'}`} variant="text" endDecorator="Calendar" onPress={() => { setShowModal(true) }} />
                {bIsTime && (<><View className='w-5'><Input
                    onChangeText={text => handleChangeTime(text, 23, 'h')}
                    onBlur={handleChangeTime2}
                    keyboardType="numeric"
                    placeholder="HH:mm"
                    className='tracking-tight font-medium text-neutral-800 dark:text-neutral-200'
                    maxLength={2}
                    placeholderTextColor="#6b7280"
                    value={`${tValue[0]}`}

                /></View>
                    <Text className="tracking-tight font-medium text-neutral-800 dark:text-neutral-200">:</Text>
                    <View className='w-5'><Input
                        onChangeText={text => handleChangeTime(text, 59, 'm')}
                        onBlur={handleChangeTime2}
                        keyboardType="numeric"
                        placeholder="HH:mm"
                        maxLength={2}
                        placeholderTextColor="#6b7280"
                        className='tracking-tight font-medium text-neutral-800 dark:text-neutral-200'
                        value={`${tValue[1]}`}

                    /></View></>)}
            </Row>
        </>
    );
}
