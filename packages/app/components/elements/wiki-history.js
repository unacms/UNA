import { useCallback, useMemo, useState } from 'react'
import { BlockWrapper } from 'app/components/block-wrapper'
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile/profile'
import CheckBox from 'app/ui/atoms/checkbox'
import { Button } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher'
import emitter, { EVENTS } from 'app/context/emitter'
import { useTranslation } from 'react-i18next'

function normalizeHistoryItems(data) {
    if (Array.isArray(data)) return data.filter(Boolean)
    if (data && typeof data === 'object') return Object.values(data).filter(Boolean)
    return []
}

function itemKey(item, index) {
    return `${item?.language || ''}:${item?.revision ?? index}`
}

function WikiHistoryItem({ item, editMode, selected, onToggle, t }) {
    const revision = item?.revision
    const language = item?.language
    const notes = item?.notes
    const revUrl = item?.rev_url
    const author = item?.author_data

    const title = (
        <Text className="text-sm font-medium text-foreground web:hover:text-primary">
            {t('Revision')} {revision}
            {language ? ` (${String(language).toUpperCase()})` : ''}
            {notes ? ` — ${notes}` : ''}
        </Text>
    )

    return (
        <Row className="items-center justify-between gap-3 py-2.5 border-b border-border last:border-b-0 w-full">
            <Row className="items-center gap-2 ">
                {editMode ? (
                    <View><CheckBox
                        title=""
                        margin=""
                        isBackground={false}
                        status={selected ? 'checked' : 'unchecked'}
                        onPress={onToggle}
                    /></View>
                ) : null}
                <View className="">
                    <Link href={revUrl}>{title}</Link>
                </View>
            </Row>
            <Row className="items-center gap-2 shrink-0">
                <Time className="text-muted-foreground text-xs" ts={item.added} format="datetime" />
                <Profile
                    {...author}
                    displayType="unit"
                    displaySize="xs"
                    showInfo="false"
                />

            </Row>
        </Row>
    )
}

/**
 * UNA wiki revision history.
 * View: list of revisions.
 * Edit (mode=edit): checkboxes + submit delete to request_url.
 */
export default function WikiHistory({
    data,
    mode,
    request_url: requestUrl,
    blockWrapperProps,
    exProps,
}) {
    const { t } = useTranslation()
    const items = normalizeHistoryItems(data)
    const editMode = mode === 'edit' && !!requestUrl
    const [selected, setSelected] = useState(() => new Set())
    const [submitting, setSubmitting] = useState(false)

    const allKeys = useMemo(
        () => items.map((item, index) => itemKey(item, index)),
        [items]
    )
    const allSelected =
        allKeys.length > 0 && allKeys.every((key) => selected.has(key))

    const toggleOne = useCallback((key) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }, [])

    const toggleAll = useCallback(() => {
        setSelected((prev) => {
            const every = allKeys.every((key) => prev.has(key))
            return every ? new Set() : new Set(allKeys)
        })
    }, [allKeys])

    const handleSubmit = useCallback(async () => {
        if (!requestUrl || selected.size === 0 || submitting) return

        const revisions = items
            .filter((item, index) => selected.has(itemKey(item, index)))
            .map((item) => item.revision)
            .filter((rev) => rev != null)

        setSubmitting(true)
        try {
            const url = '/api.php?r=' + requestUrl + encodeURIComponent(revisions.join(','))
            await fetcher(url)
            emitter.emit(EVENTS.wiki, { action: 'reload' })
            exProps?.onClose?.()
        } finally {
            setSubmitting(false)
        }
    }, [requestUrl, selected, submitting, items, exProps])

    if (!items.length) return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                {items.map((item, index) => {
                    const key = itemKey(item, index)
                    return (
                        <WikiHistoryItem
                            key={`${item.block_id || 'rev'}-${key}`}
                            item={item}
                            editMode={editMode}
                            selected={selected.has(key)}
                            onToggle={() => toggleOne(key)}
                            t={t}
                        />
                    )
                })}

                {editMode ? (
                    <Row className="gap-3 pt-3 justify-between items-center">
                        <Button
                            title={allSelected ? t('Deselect all') : t('Select all')}
                            size="sm"
                            variant="link"
                            disabled={selected.size === 0 || submitting}
                            onPress={toggleAll}
                        />
                        <Button
                            title={t('Delete selected')}
                            size="sm"
                            disabled={selected.size === 0 || submitting}
                            onPress={handleSubmit}
                        />
                    </Row>
                ) : null}
            </View>
        </BlockWrapper>
    )
}
