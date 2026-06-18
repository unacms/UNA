import { View, Row, Pressable } from 'app/design/view'
import Dropdown from 'app/ui/atoms/dropdown'
import { Icon } from 'app/ui/atoms/icon'
import { useState, useReducer, useMemo, useCallback, useEffect } from 'react';
import { Modal, Button, InputWithIcons, TextInputClear } from 'app/design/controls'
import { Text } from 'app/design/typography';
import { Platform } from 'react-native'
import { formatDate } from 'app/lib/util'
import { useTranslation } from 'react-i18next';

const timeInputKeyboard = Platform.OS === 'web'
    ? { type: 'text', inputMode: 'numeric' }
    : { keyboardType: 'numeric' };

function TimeSpinField({ value, onChangeText, onBlur, onStep, label }) {
    return (
        <View className="h-9 shrink-0 flex-row items-stretch rounded-md">
            <TextInputClear
                onChangeText={onChangeText}
                onBlur={onBlur}
                placeholder="00"
                className="h-full w-8 shrink-0 px-1 text-center text-sm font-medium tracking-tight leading-none text-secondary-foreground bg-transparent border-0 outline-none shadow-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 web:focus:shadow-none web:focus-visible:shadow-none"
                maxLength={2}
                placeholderTextColor="#6b7280"
                value={value}
                accessibilityLabel={label}
                {...timeInputKeyboard}
            />
            <View className="w-5 shrink-0 bg-muted/30">
                <Pressable
                    className="flex-1 items-center justify-center web:hover:bg-muted web:active:bg-muted"
                    onPress={() => onStep(1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${label}`}
                >
                    <Icon icon="ChevronUp" size={14} className="text-muted-foreground" />
                </Pressable>
                <Pressable
                    className="flex-1 items-center justify-center web:hover:bg-muted web:active:bg-muted"
                    onPress={() => onStep(-1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${label}`}
                >
                    <Icon icon="ChevronDown" size={14} className="text-muted-foreground" />
                </Pressable>
            </View>
        </View>
    );
}

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
                                                className={` text-base ${isToday ? 'text-white' : 'text-muted-foreground '
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

    // Split date and time components
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart ? timePart.split(':').map(Number) : [0, 0, 0];

    // Create Date object (JavaScript months are 0-based)
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

    const applyTimeValues = (hours, minutes, pad = false) => {
        const nextHours = pad ? String(hours).padStart(2, '0') : String(hours);
        const nextMinutes = pad ? String(minutes).padStart(2, '0') : String(minutes);
        settValue([nextHours, nextMinutes]);
        if (dValue) {
            setdValue(prev => {
                const d = new Date(prev.getTime());
                d.setHours(parseInt(nextHours, 10) || 0);
                d.setMinutes(parseInt(nextMinutes, 10) || 0);
                return d;
            });
        }
    };

    const adjustTime = (part, delta) => {
        const index = part === 'h' ? 0 : 1;
        const max = part === 'h' ? 23 : 59;
        let num = parseInt(tValue[index] || '0', 10);
        if (Number.isNaN(num)) num = 0;
        num = (num + delta + max + 1) % (max + 1);
        if (part === 'h') applyTimeValues(num, tValue[1], true);
        else applyTimeValues(tValue[0], num, true);
    };

    const handleChangeTime2 = () => {
        if (dValue) applyTimeValues(tValue[0], tValue[1], true);
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
            <Row className="w-full flex-nowrap items-center gap-3">
                <Pressable
                    className="min-w-0 flex-1"
                    onPress={() => setShowModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={dValue ? formatDate(dValue, t, { yearPolicy: 'always', month: 'numeric' }) : 'Select date'}
                >
                    <InputWithIcons
                        value={dValue ? formatDate(dValue, t, { yearPolicy: 'always', month: 'numeric' }) : ''}
                        placeholder="Select date"
                        rounded="default"
                        readOnly
                        editable={Platform.OS === 'web' ? undefined : false}
                        pointerEvents="none"
                        {...(Platform.OS !== 'web' ? { showSoftInputOnFocus: false } : {})}
                        endDecorator="Calendar"
                    />
                </Pressable>

                {bIsTime && (
                    <Row className="h-11 w-auto shrink-0 flex-none items-center gap-1 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg px-1.5">
                        <TimeSpinField
                            value={tValue[0]}
                            onChangeText={text => handleChangeTime(text, 23, 'h')}
                            onBlur={handleChangeTime2}
                            onStep={delta => adjustTime('h', delta)}
                            label="hours"
                        />
                        <View className="h-9 w-2 shrink-0 items-center justify-center">
                            <Text className="text-sm font-medium tracking-tight text-secondary-foreground">:</Text>
                        </View>
                        <TimeSpinField
                            value={tValue[1]}
                            onChangeText={text => handleChangeTime(text, 59, 'm')}
                            onBlur={handleChangeTime2}
                            onStep={delta => adjustTime('m', delta)}
                            label="minutes"
                        />
                    </Row>
                )}
            </Row>
        </>
    );
}
