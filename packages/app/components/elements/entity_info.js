import { useCallback, useState } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, cn } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import ProfilesList from 'app/ui/molecules/profile_list'
import Link from 'app/ui/atoms/link'
import { BlockWrapper } from 'app/components/block-wrapper'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import DatePicker from 'app/ui/atoms/date-picker'
import { useTranslation } from 'react-i18next';
import { formatDate } from 'app/lib/util'

const INFO_ICON_SIZE = 20

function isUrl(str) {
    if (typeof str !== 'string' || !str.trim()) return false;

    const value = str.trim();

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        try {
            const url = new URL('https://' + value);
            return url.hostname.includes('.');
        } catch (e2) {
            return false;
        }
    }
}

function getHandleForDisplay(input) {
    if (typeof input !== 'string') return input;

    const original = input;
    let value = input.trim();
    if (!value) return original;

    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)) {
        value = 'https://' + value;
    }

    try {
        const url = new URL(value);

        let hostname = url.hostname.toLowerCase();
        hostname = hostname.replace(/^(www|m)\./, '');

        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length === 0) return original;

        const firstSegment = decodeURIComponent(pathSegments[0]);

        const getSlug = (segment) => {
            if (!segment) return null;
            const cleaned = segment.replace(/^@/, '').trim();
            return cleaned || null;
        };

        const isTwitter =
            hostname === 'twitter.com' || hostname.endsWith('.twitter.com');
        const isX = hostname === 'x.com' || hostname.endsWith('.x.com');
        const isInstagram =
            hostname === 'instagram.com' || hostname.endsWith('.instagram.com');
        const isGithub =
            hostname === 'github.com' || hostname.endsWith('.github.com');
        const isLinkedIn =
            hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
        const isTikTok =
            hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com');
        const isFacebook =
            hostname === 'facebook.com' || hostname.endsWith('.facebook.com');
        const isYouTube =
            hostname === 'youtube.com' ||
            hostname.endsWith('.youtube.com') ||
            hostname === 'youtu.be';

        if (isTwitter || isX || isInstagram) {
            const slug = getSlug(firstSegment);
            return slug ? `@${slug}` : original;
        }

        if (isGithub) {
            const slug = getSlug(firstSegment);
            return slug ?? original;
        }

        if (isLinkedIn) {
            const [first, second] = pathSegments;
            let slug = null;

            if (first === 'in' && second) slug = getSlug(second);
            else if (first === 'company' && second) slug = getSlug(second);
            else if (first === 'school' && second) slug = getSlug(second);

            return slug ?? original;
        }

        if (isTikTok) {
            const slug = getSlug(firstSegment);
            return slug ? `@${slug}` : original;
        }

        if (isFacebook) {
            const slug = getSlug(firstSegment);
            return slug ?? original;
        }

        if (isYouTube) {
            if (hostname === 'youtu.be') {
                return original;
            }

            const [first, second] = pathSegments;

            if (first && first.startsWith('@')) {
                const slug = getSlug(first);
                return slug ? `@${slug}` : original;
            }

            if (
                (first === 'channel' || first === 'user' || first === 'c') &&
                second
            ) {
                const slug = getSlug(second);
                return slug ?? original;
            }

            return original;
        }

        return original;
    } catch {
        return original;
    }
}

function normalizeSelectValues(values) {
    if (!values) return []
    if (Array.isArray(values)) return values
    return Object.entries(values).map(([key, value]) => ({ key, value }))
}

function fieldValueToUnix(value) {
    if (value == null || value === '') return null

    if (
        typeof value === 'number' ||
        (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value)) && !value.includes('-'))
    ) {
        return Number(value)
    }

    const str = String(value).replace('Z', '')
    const [datePart, timePart] = str.split(/[T ]/)
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours = 0, minutes = 0, seconds = 0] = timePart
        ? timePart.split(':').map(Number)
        : []

    return Math.floor(new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000)
}

function useEditableRequest({ initialValue, requestUrl, fieldName, toParam = (v) => v }) {
    const [value, setValue] = useState(initialValue)

    const commit = useCallback(async (nextValue) => {
        const prevValue = value
        setValue(nextValue)
        try {
            const param = toParam(nextValue)
            await fetcher(`/api.php?r=${requestUrl}${fieldName}&params[]=${param}`)
            return true
        } catch {
            setValue(prevValue)
            return false
        }
    }, [fieldName, requestUrl, toParam, value])

    return { value, setValue, commit }
}

function EditableDate({ field, requestUrl }) {
    const initialDate =
        field.value == null || field.value === ''
            ? null
            : new Date(fieldValueToUnix(field.value) * 1000)

    const {
        value: pickerValue,
        commit: commitPickerValue,
    } = useEditableRequest({
        initialValue: initialDate,
        requestUrl,
        fieldName: field.name,
        toParam: (date) => Math.floor(date.getTime() / 1000),
    })

    const toPickerString = (date, type) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const datePart = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        if (type === 'datetime') {
            return `${datePart} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00Z`;
        }
        return datePart;
    }


    const handleChange = async (unixTs) => {
        const nextPickerValue = new Date(unixTs * 1000)
        await commitPickerValue(nextPickerValue)
    }


    const { t } = useTranslation();
    return (
        <DatePicker

            value={toPickerString(pickerValue, field.type)}
            type={field.type}
            name={field.name}
            onChange={handleChange}
        >
           
            {field.type=='datetime' ? <Time stylesName=" text-sm text-secondary-foreground " ts={field.value}/> : 
            <Text className=" text-sm text-secondary-foreground ">{pickerValue ? formatDate(pickerValue, t, {showTime: false}) : 'Select...'}</Text>}
           
        </DatePicker>
    )
}

function EditableSelect({ field, requestUrl }) {

    const [isOpen, setIsOpen] = useState(false)
    const {
        value: selectedKey,
        commit: commitSelectedKey,
    } = useEditableRequest({
        initialValue: field.value,
        requestUrl,
        fieldName: field.name,
    })
    const options = normalizeSelectValues(field.values)
    const selected =
        options.find(
            (item) => item.key?.toString() === selectedKey?.toString()
        ) ?? options.find((item) => item.key?.toString() === '')

    const handleSelect = async (key) => {
        setIsOpen(false)
        await commitSelectedKey(key)
    }

    return (
        <DropdownPopup
            trigger={
                <Text className="text-secondary-foreground text-sm">
                    {selected?.value ?? ''}
                </Text>
            }
            minPopupWidth={360}
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <View className="py-1">
                {options.map((item) => {
                    const isSelected =
                        item.key?.toString() === selected?.key?.toString()
                    return (
                        <Pressable
                            key={item.key}
                            onPress={() => handleSelect(item.key)}
                            className="px-3 py-2.5 web:hover:bg-muted/50"
                        >
                            <Text
                                className={cn(
                                    'text-sm',
                                    isSelected
                                        ? 'text-foreground font-medium'
                                        : 'text-secondary-foreground'
                                )}
                            >
                                {item.value}
                            </Text>
                        </Pressable>
                    )
                })}
            </View>
        </DropdownPopup>
    )
}

export default function ElementEntityInfo({ data, blockWrapperProps }) {
    const defaultIcon = appSetting('entry', 'default_info_icon');
    function getValue(a) {
        switch (a.type) {
            case 'datepicker':
            case 'datetime':
                if (a.editable) {
                    return (
                        <EditableDate
                            field={a}
                            requestUrl={data.params.request_url}
                        />
                    )
                }

                if (isNaN(a.value)) {
                    a.value = (new Date(a.value) / 1000);
                }

                return <Time stylesName=" text-sm text-secondary-foreground " ts={a.type=='datetime' ? a.value : (new Date(a.value) / 1000)}></Time>

            case 'select':
                if (a.editable) {
                    return (
                        <EditableSelect
                            field={a}
                            requestUrl={data.params.request_url}
                        />
                    )
                }

                if (a.value != 0 && a.value != '') {
                    const sel = a?.values?.find(item => item.key.toString() === a.value.toString())
                    return (
                        <Text className=" text-secondary-foreground text-sm ">
                            {a.values ? (sel ? sel.value : a.values[a.value]) : a.value}
                        </Text>
                    )
                }
               
                return false

            case 'textarea':
                return <Html data={a.values ? a.values[a.value] : a.value} customClassName="u-vanilla-html-small" />

            case 'location':
                return <Text className=" text-secondary-foreground text-sm ">
                    {a.value.location_string}
                </Text>

            case 'initial_members':
                return <ProfilesList
                    data={
                        a.value_data
                    }
                    showEmpty={false}
                    maxCount={3}
                    displaySize="xs"
                />

            case 'switcher':
                return <Text className=" text-secondary-foreground text-base ">
                    {a.value == 1 ? 'Yes' : 'No'}
                </Text>

            default:
                if (a.name == "profile_last_active") {
                    if (isNaN(a.value)) {
                        a.value = (new Date(a.value) / 1000);
                    }

                    return <Time stylesName=" text-base text-secondary-foreground " ts={a.value}></Time>
                }

                if (isUrl(a.value)) {
                    return (
                        <Link href={a.value} target="_blank">
                            <Text className=" text-secondary-foreground text-sm whitespace-normal wrap-break-words">
                                {getHandleForDisplay(a.value)}
                            </Text>
                        </Link>
                    )
                }

                return (
                    <Text className=" text-secondary-foreground text-sm whitespace-normal wrap-break-words">
                        {a.value}
                    </Text>
                )
        }
    }

    function getIcon(a) {
        const infoIcon = (icon) => <Icon icon={icon} size={INFO_ICON_SIZE} />

        if (a.icon) {
            return infoIcon(a.icon.charAt(0).toUpperCase() + a.icon.slice(1))
        }
        switch (a.name) {
            case 'gender':
                return infoIcon('VenusAndMars')

            case 'birthday':
                return infoIcon('Cake')

            case 'fullname':
            case 'first_name':
            case 'last_name':
            case 'name':
                return infoIcon('Signature')

            case 'description':
                return infoIcon('Shapes')

            case 'friends_count':
            case 'initial_members':
                return infoIcon('Users')

            case 'followers_count':
                return infoIcon('UserPlus')

            case 'profile_last_active':
                return infoIcon('Clock')

            case 'location':
            case 'city':
                return infoIcon('MapPin')

            case 'email':
                return infoIcon('Mail')

            case 'phone':
                return infoIcon('Phone')

            case 'website':
            case 'country':
                return infoIcon('Globe')

            case 'added':
                return infoIcon('CirclePlus')

            case 'changed':
            case 'updated':
                return infoIcon('CircleCheck')

            case 'cat':
                return infoIcon('Folder')

            case 'labels':
                return infoIcon('Tags')

            case 'stickers':
                return infoIcon('Tag')

            case 'type':
                return infoIcon('Shapes')

            case 'priority':
                return infoIcon('Flag')

            case 'estimate':
                return infoIcon('Hash')

            case 'state':
                return infoIcon('CircleDot')

            case 'tasks_list':
                return infoIcon('ListTodo')

            case 'gh_issue_url':
                return infoIcon('GitBranch')

            case 'views':
                return infoIcon('Eye')

            case 'space_name':
                return infoIcon('Boxes')

            case 'start':
            case 'start_date':
            case 'period_start':
                return infoIcon('Calendar')

            case 'end':
            case 'end_date':
            case 'period_end':
                return infoIcon('CalendarCheck')

            case 'price':
                return infoIcon('DollarSign')

            default:
                return defaultIcon ? infoIcon(defaultIcon) : null
        }
    }
    console.log("data.inputs", data.inputs)
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key]
        const v = a.values ? a.values[a.value] : a.value
        if (v || a.editable) {
            if (a.type) {
                let value = getValue(a);
                if (value || a.editable) {
                    const icon = getIcon(a)
                    return (
                        <View className={(a.type != 'textarea' ? 'flex-row items-center flex-wrap web:hover:bg-muted/50 -mx-2 -my-2 px-2 py-2 rounded-lg ' : '') + " gap-2"} key={a.name}>
                            <Row className="items-center gap-2 flex-none">
                                {icon ? (
                                    <View className="text-secondary-foreground overflow-hidden items-center justify-center w-5 h-5">{icon}</View>
                                ) : null}
                                <View>
                                    <Text className="font-bold text-sm text-card-foreground ">
                                        {a.caption}
                                    </Text>
                                </View>
                            </Row>
                            <View className=" flex-auto">
                                {getValue(a)}
                            </View>
                        </View>
                    )
                }
            } else {
                return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
            }
        }
    })

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='gap-3 lg:gap-4'>
                {inputs}
            </View>
        </BlockWrapper>
    )
}
