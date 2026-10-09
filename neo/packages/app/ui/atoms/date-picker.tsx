import { View, Row, Pressable } from 'app/design/view'
import Dropdown, { type DropdownValue } from 'app/ui/atoms/dropdown'
import { Icon } from 'app/ui/atoms/icon'
import { useState, useMemo, type ReactNode } from 'react';
import { Modal, InputWithIcons, TextInputClear, NeoButton } from 'app/design/controls'
import { Text } from 'app/design/typography';
import { Platform } from 'react-native'
import { formatDate, appSetting, useDateLocaleTag, getDateFormatSpec, getMonthTitle, getWeekdayShort } from 'app/lib/util'
import { useTranslation } from 'react-i18next';

type Option = { value: string | number; label?: string };

const timeInputKeyboard: Record<string, string> = Platform.OS === 'web'
    ? { type: 'text', inputMode: 'numeric' }
    : { keyboardType: 'numeric' };

const hours = Array.from({ length: 24 }, (_, i) => {
    const label = String(i).padStart(2, '0');
    return { value: label, label };
});

const minutes = Array.from({ length: 60 }, (_, i) => {
    const label = String(i).padStart(2, '0');
    return { value: label, label };
});

function TimeSelectField({ value, options, onChange, label }: { value: string; options: Option[]; onChange: (value: DropdownValue) => void; label: string }) {
    return (
        <View className="min-h-9 w-20 shrink-0">
            <Dropdown
                labelField="label"
                valueField="value"
                onChange={onChange}
                data={options}
                value={value}
                size="small"
                accessibilityLabel={label}
            />
        </View>
    );
}

function TimeSpinField({ value, onChangeText, onBlur, onStep, label }: {
    value: string;
    onChangeText: (text: string) => void;
    onBlur: () => void;
    onStep: (delta: number) => void;
    label: string;
}) {
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

const years: Option[] = [];
for (let y = 1900; y <= 2100; y++) {
    years.push({ value: y });
}

const dateInputOpts = { yearPolicy: 'always' as const, month: '2-digit' as const };

/** `weekStart`: first day of week, 0 = Sunday. Days before `minDate` (by calendar day) can't be selected. */
export function MonthCalendar({ date = new Date(), onSelect, selectedDate, weekStart = 1, minDate }: { date?: Date; onSelect: (date: Date) => void; selectedDate?: Date | null; weekStart?: 0 | 1; minDate?: Date }) {
    const { t } = useTranslation();
    // Year and month to display

    const displayYear = date.getFullYear();
    const displayMonth = date.getMonth() + 1;
    const minDay = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;

    // First day of the month and total days
    const firstOfMonth = new Date(displayYear, displayMonth - 1, 1);
    const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();
    const startWeekday = (firstOfMonth.getDay() - weekStart + 7) % 7; // column of the 1st
    const weekdays = Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7);

    // Create array of 42 days (6 weeks)
    const cells = Array.from({ length: 42 }, (_, idx) => {
        const day = idx - startWeekday + 1;
        return day > 0 && day <= daysInMonth ? day : null;
    });

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < 6; i++) {
        weeks.push(cells.slice(i * 7, i * 7 + 7));
    }

    return (
        <View className="space-y-2 items-center">
            <View className="flex-row">
                {weekdays.map(day => (
                    <View key={day} className="h-8 w-10 items-center justify-center">
                        <Text className="text-xs font-medium text-muted-foreground">{getWeekdayShort(t, day)}</Text>
                    </View>
                ))}
            </View>
            {weeks.map((week, wIdx) => (
                <View key={wIdx} className="flex-row ">
                    {week.map((day, dIdx) => {
                        const isToday = selectedDate ? (new Date(displayYear, displayMonth - 1, day ?? 0)).toDateString() == selectedDate.toDateString() : null;
                        const isDisabled = !!(day && minDay && new Date(displayYear, displayMonth - 1, day) < minDay);

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
                                        <Pressable disabled={isDisabled} accessibilityState={{ disabled: isDisabled }} onPress={() => { onSelect(new Date(displayYear, displayMonth - 1, day, selectedDate ? selectedDate.getHours() : 0, selectedDate ? selectedDate.getMinutes() : 0, selectedDate ? selectedDate.getSeconds() : 0)) }}>
                                            <Text
                                                className={` text-base ${isToday ? 'text-white' : 'text-muted-foreground '
                                                    } ${isDisabled ? 'opacity-30' : ''}`}
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

export function CalendarHeader({ value, addMonth, setDatePart }: {
    value: Date | null;
    addMonth: (type: 'm', val: number) => void;
    setDatePart: (type: 'y' | 'm', val: number) => void;
}) {
    const { t } = useTranslation();
    const months = useMemo(() => Array.from({ length: 12 }, (_, value) => ({ value, label: getMonthTitle(t, value) })), [t]);

    const setY = (val: DropdownValue) => {
        setDatePart('y', Number(val));
    }

    const setM = (val: DropdownValue) => {
        setDatePart('m', Number(val));
    }
    return (
        <Row className='items-center gap-x-2 justify-center'>

            <NeoButton borderShape="circle" image="ChevronLeft" accessibilityLabel={t('Previous month')} classNames={{ root: 'self-center' }} onPress={() => addMonth('m', -1)} />


            <View className='w-32'>
                <Dropdown labelField="label"
                    key={"year-dropdown1" + value}
                    valueField="value"
                    onChange={setM}
                    data={months}
                    value={value ? value.getMonth() : ''}
                />
            </View>
            <View className='w-28'>
                <Dropdown labelField="value"
                    key={"year-dropdown" + value}
                    valueField="value"
                    onChange={setY}
                    data={years}
                    value={value ? value.getFullYear() : ''}
                />
            </View>
            <NeoButton borderShape="circle" image="ChevronRight" accessibilityLabel={t('Next month')} classNames={{ root: 'self-center' }} onPress={() => addMonth('m', 1)} />
        </Row>
    )
}

/** "YYYY-MM-DD[ HH:MM[:SS]]" in local time. */
const formatDateTime = (dateString: string) => {
    const [datePart = '', timePart] = dateString.replace('Z', '').split(' ');

    // Split date and time components
    // Malformed input yields NaN parts and an Invalid Date, as before.
    const [year, month, day] = datePart.split('-').map(Number) as [number, number, number];
    const [hours, minutes, seconds] = (timePart ? timePart.split(':').map(Number) : [0, 0, 0]) as [number, number, number];

    // Create Date object (JavaScript months are 0-based)
    return new Date(year, month - 1, day, hours, minutes, seconds);
}

type DatePickerProps = {
    name?: string;
    /** "YYYY-MM-DD" or "YYYY-MM-DD HH:MM[:SS]". */
    value?: string;
    /** `datetime` adds hour/minute fields (spinners or selects, per `forms.time` setting). */
    type?: 'date' | 'datetime';
    /** Unix timestamp, seconds. */
    onChange?: (timestamp: number) => void;
    /** Custom trigger content; renders a NeoButton instead of the date input. */
    children?: ReactNode;
    /** Extra NeoButton props for the custom trigger. */
    buttonProps?: Record<string, any>;
    /** Earliest selectable day. */
    minDate?: Date;
    /** Read-only: the calendar and time fields can't be opened or changed. */
    disabled?: boolean;
};

export default function DatePicker({ name, value = '', type, onChange, children, buttonProps, minDate, disabled = false }: DatePickerProps) {
    const bIsTime = type === 'datetime';
    const timeMode = appSetting('forms', 'time');
    const { t } = useTranslation();
    const localeTag = useDateLocaleTag();
    const dateDisplayOpts = { ...dateInputOpts, locale: localeTag };
    const { weekStart } = getDateFormatSpec(localeTag);
    const [showModal, setShowModal] = useState(false);
    const initValue = formatDateTime(value);
    const [dValue, setdValue] = useState<Date | null>(value ? initValue : null);
    const [cValue, setcValue] = useState(value ? initValue : new Date());
    const [tValue, settValue] = useState<[string, string]>(value ? [String(initValue.getHours()).padStart(2, '0'), String(initValue.getMinutes()).padStart(2, '0')] : ['00', '00']);

    const emitChange = (date: Date | null) => {
        if (!date || Number.isNaN(date.getTime()) || typeof onChange !== 'function') return;
        onChange(date.getTime() / 1000);
    };



    const addMonth = (type: 'm', val: number) => {
        setcValue(prev => {
            const next = new Date(prev.getTime());
            next.setMonth(next.getMonth() + val);
            return next;
        });
    };

    const setDatePart = (type: 'y' | 'm', val: number) => {
        setcValue(prev => {
            const d = new Date(prev.getTime());
            if (type === 'm') d.setMonth(val);
            if (type === 'y') d.setFullYear(val);
            return d;
        });
    };

    const handleChangeTime = (text: string, maxValue: number, type: 'h' | 'm') => {
        let filtered = text.replace(/[^0-9]/g, '');
        if (filtered !== '') {
            const num = parseInt(filtered, 10);
            filtered = num > maxValue
                ? String(maxValue)
                : String(num);
        }

        settValue(prev => {
            const j: [string, string] = [...prev];
            if (type === 'm') j[1] = filtered;
            if (type === 'h') j[0] = filtered;

            return j;
        });



    };

    const applyTimeValues = (hours: DropdownValue, minutes: DropdownValue, pad = false) => {
        const nextHours = pad ? String(hours).padStart(2, '0') : String(hours);
        const nextMinutes = pad ? String(minutes).padStart(2, '0') : String(minutes);
        settValue([nextHours, nextMinutes]);
        if (dValue) {
            const d = new Date(dValue.getTime());
            d.setHours(parseInt(nextHours, 10) || 0);
            d.setMinutes(parseInt(nextMinutes, 10) || 0);
            setdValue(d);
            emitChange(d);
        }
    };

    const adjustTime = (part: 'h' | 'm', delta: number) => {
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

    const onSelectDate = (next: Date) => {
        setShowModal(false)
        setdValue(next);
        emitChange(next);
    }

   
    return (
        <>
            <Modal onVisible={!!showModal} title={t('Select date')} onClose={() => { setShowModal(false) }}>
                <View className='   w-full mx-auto'>
                    <View className='  w-full '>
                        <CalendarHeader value={cValue} addMonth={addMonth} setDatePart={setDatePart} />
                        <View className='mt-4'>
                            <MonthCalendar date={cValue} selectedDate={dValue} onSelect={onSelectDate} weekStart={weekStart} minDate={minDate} />
                        </View>

                    </View>
                </View>
            </Modal>
            {children ? (
                <NeoButton
                    style="borderless"
                    controlSize="small"
                    align="start"
                    {...buttonProps}
                    disabled={disabled}
                    onPress={() => setShowModal(true)}
                    accessibilityLabel={dValue ? formatDate(dValue, t, dateDisplayOpts) : t('Select date')}
                >
                    {children}
                </NeoButton>
            ) : (
            <Row className={`w-full flex-nowrap items-center gap-3 ${disabled ? 'opacity-50' : ''}`} pointerEvents={disabled ? 'none' : 'auto'}>
                <Pressable
                    className="min-w-0 flex-1"
                    disabled={disabled}
                    onPress={() => setShowModal(true)}
                    accessibilityRole="button"
                    accessibilityLabel={dValue ? formatDate(dValue, t, dateDisplayOpts) : t('Select date')}
                >
                    <InputWithIcons
                        value={dValue ? formatDate(dValue, t, dateDisplayOpts) : ''}
                        placeholder={t('Select date')}
                        rounded="default"
                        readOnly
                        editable={Platform.OS === 'web' ? undefined : false}
                        pointerEvents="none"
                        {...(Platform.OS !== 'web' ? { showSoftInputOnFocus: false } : {})}
                        endDecorator="Calendar"
                    />
                </Pressable>

                {bIsTime && (
                    timeMode === 'select' ? (
                        <Row className="min-h-10 w-auto shrink-0 flex-none items-center gap-1 px-1.5">
                            <TimeSelectField
                                value={tValue[0]}
                                options={hours}
                                onChange={val => applyTimeValues(val, tValue[1], false)}
                                label={t('hours')}
                            />
                            <View className="h-9 w-2 shrink-0 items-center justify-center">
                                <Text className="text-sm font-medium tracking-tight text-secondary-foreground">:</Text>
                            </View>
                            <TimeSelectField
                                value={tValue[1]}
                                options={minutes}
                                onChange={val => applyTimeValues(tValue[0], val, false)}
                                label={t('minutes')}
                            />
                        </Row>
                    ) : (
                        <Row className="min-h-10 w-auto shrink-0 flex-none items-center gap-1 bg-input/60 shadow-input-outline dark:shadow-input-outline-deep rounded-lg px-1.5">
                            <TimeSpinField
                                value={tValue[0]}
                                onChangeText={text => handleChangeTime(text, 23, 'h')}
                                onBlur={handleChangeTime2}
                                onStep={delta => adjustTime('h', delta)}
                                label={t('hours')}
                            />
                            <View className="h-9 w-2 shrink-0 items-center justify-center">
                                <Text className="text-sm font-medium tracking-tight text-secondary-foreground">:</Text>
                            </View>
                            <TimeSpinField
                                value={tValue[1]}
                                onChangeText={text => handleChangeTime(text, 59, 'm')}
                                onBlur={handleChangeTime2}
                                onStep={delta => adjustTime('m', delta)}
                                label={t('minutes')}
                            />
                        </Row>
                    )
                )}
            </Row>)}
        </>
    );
}
