import { View, Row } from 'app/design/view'
import Dropdown from 'app/ui/atoms/dropdown'
import { useState, useReducer, useMemo, useEffect, type ComponentType } from 'react';
import { Modal } from 'app/design/controls'
import { NeoButton } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { useTheme } from 'app/design/theme';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

/** Date part (YYYY-MM-DD) plus hour and minute, all as strings. */
type DateTimeValue = { dt: string; h: string; m: string };

const formatValueDate = (v: DateTimeValue) => {
    if (v.dt){
        const date = new Date(v.dt);

        const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        return localDate.toLocaleDateString();
    }
    return ''
}

const formatValue = (v: DateTimeValue, bIsTime: boolean) => {
    if (v.dt != '') {
        let v3 = formatValueDate(v);
        if (bIsTime)
            return `${v3} ${v.h}:${v.m}`
        else
            return v3;
    }
    else {
        return bIsTime ? i18n.t('Select date/time') : i18n.t('Select date');
    }
}

const setdValue_ = (state: DateTimeValue, action: { type: keyof DateTimeValue; value: string }) => {
    return { ...state, [action.type]: action.value };
}

const loadCalendar = async (setDynamicCalendar: (factory: () => ComponentType<any>) => void) => {
    const Calendars = await import('react-native-calendars');
    setDynamicCalendar(() => Calendars.Calendar);
};

const CalendarHeader = (dValue: DateTimeValue, addMonth: (type: 'y' | 'm', val: number) => void) => {
    return (
    <Row className='w-full justify-between gap-2 mb-4 items-center mt-2'>
        <NeoButton controlSize="small" borderShape="circle" image="ChevronsLeft" accessibilityLabel={i18n.t('Previous year')} classNames={{ root: 'self-center' }} onPress={() => addMonth('y', -1)} />
        <NeoButton controlSize="small" borderShape="circle" image="ChevronLeft" accessibilityLabel={i18n.t('Previous month')} classNames={{ root: 'self-center' }} onPress={() => addMonth('m', -1)} />
        <Text className=" font-medium text-muted-foreground text-lg">{dValue.dt ? formatValueDate(dValue) : i18n.t('Select date')}</Text>
        <NeoButton controlSize="small" borderShape="circle" image="ChevronRight" accessibilityLabel={i18n.t('Next month')} classNames={{ root: 'self-center' }} onPress={() => addMonth('m', 1)} />
        <NeoButton controlSize="small" borderShape="circle" image="ChevronsRight" accessibilityLabel={i18n.t('Next year')} classNames={{ root: 'self-center' }} onPress={() => addMonth('y', 1)} />
    </Row>
)};

const generateValues = (range: number) => Array.from({ length: range }, (_, i) => ({ label: i.toString().padStart(2, '0'), value: i.toString().padStart(2, '0') }));

type CalendarFieldProps = {
    name?: string;
    /** "YYYY-MM-DD" or "YYYY-MM-DD HH:MM". */
    value?: string;
    type?: 'date' | 'datetime';
    /** Unix timestamp, seconds. */
    onChange: (timestamp: number) => void;
};

export default function CalendarField({ name, value = '', type, onChange }: CalendarFieldProps) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const bIsTime = type === 'datetime';
    const [showModal, setShowModal] = useState(false);
    const [DynamicCalendar, setDynamicCalendar] = useState<ComponentType<any> | null>(null);
    
    const [date = '', hour = '00', minute = '00'] = value.split(/[: ]/);
    const [dValue, setdValue] = useReducer(setdValue_, { dt: date, h: hour, m: minute });
    const [cValue, setcValue] = useState({ dt: date, h: hour, m: minute });

    useEffect(() => {
        let isMounted = true;
        loadCalendar(setDynamicCalendar).catch(console.error).then(() => {
            if (!isMounted) setDynamicCalendar(null);
        });
        return () => { isMounted = false; };
    }, []);

    const setFieldValue = (val: DateTimeValue, hide = true) => {
        setcValue(val)
        onChange((new Date(`${val.dt} ${val.h}:${val.m}`).getTime()) / 1000)
        if (hide)
            setShowModal(false);
    }

    const setValueDay = (day: { dateString: string }, hide = true) => {
        setdValue({ type: 'dt', value: day.dateString })
        if (!bIsTime) {
            setFieldValue({ dt: day.dateString, h: dValue.h, m: dValue.m }, hide);
        }
    };

    const addMonth = (type: 'y' | 'm', val: number) => {
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
            <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }}>
                <View className='  max-w-sm w-full mx-auto'>
                    <View className='  max-w-sm w-full mx-auto aspect-square mb-4'>
                        {DynamicCalendar && <DynamicCalendar
                            className=' bg-card'
                            theme={{
                                calendarBackground: colors.background2,
                                dayTextColor: colors.text,
                                textDisabledColor: colors.text,
                                monthTextColor: colors.text,
                            }}
                            renderArrow={(direction: 'left' | 'right') => { return <View className="text-secondary-foreground "><Icon icon={direction == 'left' ? 'ArrowLeft' : 'ArrowRight'} width={24} height={24} /></View> }}
                            initialDate={dValue.dt}
                            customHeader={() => CalendarHeader(dValue, addMonth)}
                            onDayPress={(day: { dateString: string }) => {
                                setValueDay(day)
                            }}
                            markedDates={{
                                [dValue.dt]: { selected: true, selectedColor: colors.primary }
                            }}
                        />}
                        {
                        bIsTime && (<View className='w-full justify-center items-center gap-y-4'><Row className='justify-center items-center w-64 mt-2'>
                            <Text className=" text-base justify-center items-center text-popover-foreground "> {t('Time')} </Text>
                            <View>
                                <Dropdown
                                    labelField="label"
                                    valueField="value"
                                    onChange={(v) => setdValue({ type: 'h', value: String(v) })}
                                    value={dValue.h}
                                    data={hours}
                                />
                            </View>
                            <Text className=" text-base justify-center items-center text-popover-foreground "> : </Text>
                            <View>
                                <Dropdown
                                    labelField="label"
                                    valueField="value"
                                    onChange={(v) => setdValue({ type: 'm', value: String(v) })}
                                    value={dValue.m}
                                    data={minutes}
                                />
                            </View>
                        </Row>
                            <NeoButton label={t('Apply')} classNames={{ root: 'self-center' }} onPress={() => { setFieldValue(dValue) }} />
                        </View>
                        )
                    }
                    </View>

                    
                </View>
            </Modal>
            <Row>
                <NeoButton label={formatValue(cValue, bIsTime)} image="Calendar" imagePlacement="trailing" onPress={() => { setShowModal(true) }} />
            </Row>
        </>
    );
}
