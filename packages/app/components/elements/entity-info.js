import { useState } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, cn, isUrl } from 'app/lib/util'
import { useEditableRequest } from 'app/lib/form/form-helpers'
import Profile from 'app/ui/molecules/profile/profile'
import { BlockWrapper } from 'app/components/block-wrapper'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import DatePicker from 'app/ui/atoms/date-picker'
import { useTranslation } from 'react-i18next';
import { formatDate } from 'app/lib/util'
import { Modal, NeoButton, NeoButtonLink } from 'app/design/controls'
import { SelectUsers, User } from 'app/components/form-fields/initial-members'
import { buildTasksHomeUrl } from 'app/components/elements/tasks/helpers'

const EDITABLE_VALUE_BUTTON = {
    style: 'borderless',
    controlSize: 'small',
    borderShape: 'capsule',
    align: 'start',
}

/** UNA price fields arrive as `{ value, currency }` (see form-fields/price.js). */
function isPriceObject(value) {
    return (
        value != null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        'value' in value &&
        'currency' in value
    )
}

function formatPriceLabel(value, valueCurrency) {
    if (isPriceObject(value)) {
        const amount = value.value
        const currency = value.currency || valueCurrency || ''
        if (amount == null || amount === '') return ''
        return currency ? `${amount} ${currency}` : String(amount)
    }
    if (value == null || value === '') return ''
    return valueCurrency ? `${value} ${valueCurrency}` : String(value)
}

function TasksListOpenLink({ href, label }) {
    if (!href) return null
    return (
        <NeoButtonLink
            href={href}
            style="borderless"
            controlSize="mini"
            borderShape="circle"
            image="ArrowRight"
            accessibilityLabel={label}
        />
    )
}

function withTasksListLink(value, href, label) {
    if (!href) return value
    return (
        <Row className="items-center gap-0.5 min-w-0">
            {value}
            <TasksListOpenLink href={href} label={label} />
        </Row>
    )
}

function ReadonlyValue({ href, label, children }) {
    const props = {
        ...EDITABLE_VALUE_BUTTON,
        ...(label != null ? { label } : {}),
    }
    if (href) {
        return (
            <NeoButtonLink {...props} href={href} target="_blank">
                {children}
            </NeoButtonLink>
        )
    }
    if (label != null) {
        return <NeoButton {...props} disabled />
    }
    return (
        <NeoButton {...props} disabled>
            {children}
        </NeoButton>
    )
}

const INFO_ICON_SIZE = 16

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

function calendarDayKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateToUnixParam(date, type) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
    if (type === 'datetime') {
        return Math.floor(date.getTime() / 1000)
    }
    // Date-only fields must not use local midnight: in UTC+N that instant is
    // the previous calendar day on a UTC server, so each save walked the due
    // date back by one day.
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000)
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
        toParam: (date) => dateToUnixParam(date, field.type),
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
        if (field.type !== 'datetime' && calendarDayKey(nextPickerValue) === calendarDayKey(pickerValue)) {
            return
        }
        await commitPickerValue(nextPickerValue)
    }


    const { t } = useTranslation();
    return (
        <DatePicker

            value={toPickerString(pickerValue, field.type)}
            type={field.type}
            name={field.name}
            onChange={handleChange}
            buttonProps={EDITABLE_VALUE_BUTTON}
        >
           
            {field.type=='datetime' ? <Time stylesName=" text-sm text-secondary-foreground " ts={field.value}/> : 
            <Text className=" text-sm text-secondary-foreground ">{pickerValue ? formatDate(pickerValue, t, {showTime: false}) : 'Select...'}</Text>}
           
        </DatePicker>
    )
}

function EditableSelect({ field, requestUrl, openHref }) {

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

    const select = (
        <DropdownPopup
            buttonProps={{
                ...EDITABLE_VALUE_BUTTON,
                label: selected?.value ?? '',
                accessibilityLabel: field.caption,
            }}
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

    const href = typeof openHref === 'function' ? openHref(selectedKey) : openHref
    return withTasksListLink(select, href, field.caption)
}

function dedupeProfiles(list) {
    if (!Array.isArray(list)) return []
    return list.filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index)
}

function profileDisplayName(profile) {
    return profile?.display_name || profile?.title || profile?.name || ''
}

function AssigneeChip({ profile, onPress, disabled }) {
    const data = profile?.author_data || profile
    const name = profileDisplayName(data)
    return (
        <NeoButton
            {...EDITABLE_VALUE_BUTTON}
            controlSize="mini"
            image={
                <Profile
                    {...data}
                    displayType="unit_wo_info"
                    displaySize="3xs"
                    showLinks={false}
                />
            }
            label={name}
            accessibilityLabel={name}
            onPress={onPress}
            disabled={disabled || !onPress}
        />
    )
}

function AssigneeChips({ profiles, onPress, disabled }) {
    const list = dedupeProfiles(profiles)
    if (!list.length) return null
    return (
        <Row className="items-center flex-wrap gap-0.5 min-w-0 self-start">
            {list.map((item) => (
                <AssigneeChip
                    key={item.id}
                    profile={item}
                    onPress={onPress}
                    disabled={disabled}
                />
            ))}
        </Row>
    )
}

function suggestionsRequestUrl(ajaxGetSuggestions) {
    if (!ajaxGetSuggestions) return null
    // Same URL build as FormFieldInitialMembers
    return '/api.php?r=' + ajaxGetSuggestions + (ajaxGetSuggestions.includes('params[]') ? '' : '&params=')
}

function EditableInitialMembers({ field, requestUrl }) {
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isSelectOpen, setIsSelectOpen] = useState(false)
    const [profiles, setProfiles] = useState(() => dedupeProfiles(field.value_data || []))
    const {
        commit: commitIds,
    } = useEditableRequest({
        initialValue: field.value || (field.value_data || []).map((item) => item.id),
        requestUrl,
        fieldName: field.name,
        toParam: (ids) => encodeURIComponent((Array.isArray(ids) ? ids : []).join(',')),
    })

    const saveProfiles = async (nextProfiles) => {
        const deduped = dedupeProfiles(nextProfiles)
        const prevProfiles = profiles
        setProfiles(deduped)
        setIsSelectOpen(false)
        const ok = await commitIds(deduped.map((item) => item.id))
        if (!ok) setProfiles(prevProfiles)
    }

    // Same as FormFieldInitialMembers.onSave
    const onSave = (data, isAdd = false) => {
        if (isAdd) {
            data = [...profiles, ...data]
        }
        saveProfiles(data)
    }

    const onRemove = (profile) => {
        saveProfiles(profiles.filter((item) => item.id !== profile.id))
    }

    const suggestUrl = suggestionsRequestUrl(field.ajax_get_suggestions)
    const openEditor = () => setIsEditorOpen(true)

    // Screen 1: named profile chips. Click → modal with form control (screen 2).
    return (
        <>
            <Modal
                title={field.caption || 'Assign to'}
                onVisible={!!isEditorOpen}
                onClose={() => {
                    setIsEditorOpen(false)
                    setIsSelectOpen(false)
                }}
            >
                {suggestUrl && isSelectOpen ? (
                    <Modal
                        title={field.caption || 'Choose users'}
                        onVisible={!!isSelectOpen}
                        onClose={() => setIsSelectOpen(false)}
                    >
                        <SelectUsers
                            onSave={onSave}
                            requestUrl={suggestUrl}
                            initedData={[]}
                        />
                    </Modal>
                ) : null}
                <Row className="w-full px-1.5 py-1 items-center justify-between flex-wrap shadow-input-outline dark:shadow-input-outline-deep rounded-lg bg-input/60">
                    <Row className="gap-2 items-center flex-wrap my-auto flex-1">
                        {profiles.map((item, index) => (
                            <User
                                type="multi"
                                key={item.id ?? item.value ?? `assigned-${index}`}
                                data={item}
                                onSelect={onRemove}
                            />
                        ))}
                    </Row>
                    <NeoButton
                        image="Plus"
                        style="borderless"
                        controlSize="small"
                        accessibilityLabel={field.caption || 'Add'}
                        onPress={() => setIsSelectOpen(true)}
                        disabled={!suggestUrl}
                    />
                </Row>
            </Modal>

            {profiles.length > 0 ? (
                <AssigneeChips profiles={profiles} onPress={openEditor} />
            ) : (
                <NeoButton
                    image="Plus"
                    style="borderless"
                    controlSize="small"
                    accessibilityLabel={field.caption || 'Add'}
                    onPress={openEditor}
                    disabled={!suggestUrl}
                />
            )}
        </>
    )
}

export default function ElementEntityInfo({ data, blockWrapperProps }) {
    const defaultIcon = appSetting('entry', 'default_info_icon');
    const contextPid = data.params?._context_id ?? data.params?.context_id
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

                return (
                    <ReadonlyValue>
                        <Time stylesName=" text-sm text-secondary-foreground " ts={a.type=='datetime' ? a.value : (new Date(a.value) / 1000)} />
                    </ReadonlyValue>
                )

            case 'select': {
                const isTasksList = a.name === 'tasks_list'
                const listHref = isTasksList
                    ? (listId) => buildTasksHomeUrl(contextPid, listId)
                    : undefined

                if (a.editable) {
                    return (
                        <EditableSelect
                            field={a}
                            requestUrl={data.params.request_url}
                            openHref={listHref}
                        />
                    )
                }

                const hasValue = (a.value != 0 && a.value != '') || isTasksList
                if (!hasValue) return false

                const sel = a?.values?.find(item => item.key?.toString() === a.value?.toString())
                const value = (
                    <ReadonlyValue
                        label={a.values ? (sel ? sel.value : a.values[a.value]) : a.value}
                    />
                )
                return withTasksListLink(
                    value,
                    listHref?.(a.value),
                    a.caption
                )
            }

            case 'textarea':
                return <Html data={a.values ? a.values[a.value] : a.value} customClassName="u-vanilla-html-small" />

            case 'location':
                return <ReadonlyValue label={a.value.location_string} />

            case 'initial_members':
                if (a.editable) {
                    return (
                        <EditableInitialMembers
                            field={a}
                            requestUrl={data.params.request_url}
                        />
                    )
                }
                return <AssigneeChips profiles={a.value_data} />

            case 'switcher':
                return <ReadonlyValue label={a.value == 1 ? 'Yes' : 'No'} />

            case 'price': {
                const label = formatPriceLabel(a.value, a.value_currency)
                return label ? <ReadonlyValue label={label} /> : false
            }

            default:
                if (a.name == "profile_last_active") {
                    if (isNaN(a.value)) {
                        a.value = (new Date(a.value) / 1000);
                    }

                    return (
                        <ReadonlyValue>
                            <Time stylesName=" text-base text-secondary-foreground " ts={a.value} />
                        </ReadonlyValue>
                    )
                }

                if (isUrl(a.value)) {
                    return (
                        <ReadonlyValue href={a.value}>
                            <Text className=" text-secondary-foreground text-sm whitespace-normal wrap-break-words">
                                {getHandleForDisplay(a.value)}
                            </Text>
                        </ReadonlyValue>
                    )
                }

                if (isPriceObject(a.value)) {
                    const label = formatPriceLabel(a.value, a.value_currency)
                    return label ? <ReadonlyValue label={label} /> : false
                }

                return <ReadonlyValue label={a.value} />
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

    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key]
        const v = a.values ? a.values[a.value] : a.value
        if (v || a.editable) {
            if (a.type) {
                let value = getValue(a);
                if (value || a.editable) {
                    const icon = getIcon(a)
                    return (
                        <View className={(a.type != 'textarea' ? 'flex-row items-center flex-wrap  ' : '') + " gap-2"} key={a.name}>
                            <Row className="items-center gap-2 flex-none w-1/3">
                                {icon ? (
                                    <View className="text-secondary-foreground overflow-hidden items-center justify-center w-5 h-5">{icon}</View>
                                ) : null}
                                <View className="flex-auto">
                                    <Text className=" text-sm leading-tight text-secondary-foreground ellipsis">
                                        {a.caption}
                                    </Text>
                                </View>
                            </Row>
                            <View className="flex-auto">
                                {value}
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
            <View className='gap-1'>
                {inputs}
            </View>
        </BlockWrapper>
    )
}
