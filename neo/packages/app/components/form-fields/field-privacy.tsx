import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Row } from 'app/design/view'
import { NeoButton, Modal } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import { fetcher } from 'app/lib/fetcher'
import { visibilityById } from 'app/lib/util'
import { playCue } from 'app/lib/sound'
import RbList from 'app/ui/molecules/form-controls/radio-list'

// Who sees a form field: the chooser UNA draws next to a field with privacy (Studio > Forms > a field >
// Privacy). UNA sends it as the field's `privacy_chooser` in a form to fill, only to a profile whose level
// can set it, and saves a choice at once with `system/set_form_input_privacy`, apart from the form's submit.

interface PrivacyGroup {
    key: string | number
    value: string
}

/** `privacy_chooser` of a form input (BxBaseFormView::getPrivacyGroupChooserAPI). */
export interface FieldPrivacyChooser {
    input_id: number
    /** The privacy group now. */
    value: string | number
    values: PrivacyGroup[]
    /** The group's name. */
    title?: string
    /** "Visible to: <group>", for screen readers. */
    label?: string
}

interface FieldPrivacyProps {
    chooser?: FieldPrivacyChooser | null
}

interface Current {
    value: string
    title: string
    label: string
}

const FALLBACK_ICON = 'Users'

export default function FieldPrivacy({ chooser }: FieldPrivacyProps) {
    const { t } = useTranslation()
    const [isModal, setIsModal] = useState(false)
    const [saved, setSaved] = useState<Current | null>(null)

    const groups = Array.isArray(chooser?.values) ? chooser.values : []
    if (!chooser?.input_id || groups.length === 0) return null

    const current: Current = saved ?? {
        value: String(chooser.value ?? ''),
        title: chooser.title || '',
        label: chooser.label || '',
    }

    const options = groups.map((group) => ({
        value: String(group.key),
        label: group.value,
        icon: (
            <View className="h-6 w-6 overflow-hidden">
                <Icon icon={visibilityById(group.key, t)?.icon || FALLBACK_ICON} width={24} height={24} />
            </View>
        ),
    }))

    const title = current.title || options.find((item) => item.value === current.value)?.label || t('Choose audience')

    const select = async (value: string | number) => {
        const next = String(value)
        setIsModal(false)
        if (next === current.value) return

        const option = options.find((item) => item.value === next)
        setSaved({ value: next, title: option?.label || '', label: '' })

        let data: any = null
        try {
            const response = await fetcher(
                '/api.php?r=system/set_form_input_privacy/TemplServices&params[]=' +
                    encodeURIComponent(String(chooser.input_id)) +
                    '&params[]=' +
                    encodeURIComponent(next)
            )
            data = response?.data
        } catch {
            data = null
        }

        if (data && typeof data === 'object' && String(data.value) === next) {
            setSaved({ value: next, title: data.title || option?.label || '', label: data.label || '' })
            playCue('success', { emphasis: 'subtle' })
        } else {
            // UNA refused or didn't answer: the field keeps the audience it had
            setSaved(current)
            playCue('error')
        }
    }

    return (
        <>
            <Modal
                title={t('Choose audience')}
                onVisible={isModal}
                onClose={() => setIsModal(false)}
                transparent
                headerBorder
                scrollable
            >
                <RbList key={current.value} values={options} setValue={select} selectedValue={current.value} />
            </Modal>
            <Row className="justify-start">
                <NeoButton
                    style="borderless"
                    controlSize="mini"
                    image={visibilityById(current.value, t)?.icon || FALLBACK_ICON}
                    label={title}
                    accessibilityLabel={current.label || title}
                    onPress={() => setIsModal(true)}
                />
            </Row>
        </>
    )
}
