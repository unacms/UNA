'use client'

import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import Field from './_field'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Input } from 'app/design/controls'
import CheckBox from 'app/ui/atoms/checkbox'
import Loading from 'app/ui/atoms/loading'
import { fetcher } from 'app/lib/fetcher'
import { useTranslation } from 'react-i18next'

function resolveItemsUrl(requestUrl, moduleId) {
    if (!requestUrl || !moduleId) return null
    if (requestUrl.includes('api.php')) {
        return requestUrl.endsWith('=') || requestUrl.endsWith('/')
            ? requestUrl + moduleId
            : requestUrl + moduleId
    }
    return '/api.php?r=' + requestUrl + moduleId
}

function normalizeItems(payload) {
    if (!payload) return []

    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload?.data?.items)) return payload.data.items

    return []
}

function itemPrice(item) {
    const raw =
        item?.price ??
        item?.price_single ??
        item?.price_f ??
        item?.[0] ??
        0
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
}

function itemTitle(item) {
    return String(item?.title || item?.name || item?.id || '')
}

export default function PaymentItems(props) {
    const { t } = useTranslation()
    const formContext = useFormContext()
    const moduleId = useWatch({ control: formContext.control, name: 'module_id' })
    const sellerId = useWatch({ control: formContext.control, name: 'seller_id' })

    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState([])
    const [filter, setFilter] = useState('')
    const [selected, setSelected] = useState({})

    const requestUrl =
        props.request_url ||
        props.module_request_url ||
        '/api.php?r=bx_payment/get_items&params[]=single&params[]='

    useEffect(() => {
        const id = Number(moduleId)
        if (!id) {
            setItems([])
            setSelected({})
            formContext.setValue('items', [])
            return
        }

        let cancelled = false
        const load = async () => {
            setLoading(true)
            try {
                let url = resolveItemsUrl(requestUrl, id)
                if (!url) return

                if (sellerId) {
                    url +=
                        (url.includes('?') ? '&' : '?') +
                        'seller_id=' +
                        encodeURIComponent(sellerId)
                }

                const response = await fetcher(url)
                if (cancelled) return

                const list = normalizeItems(response?.data ?? response)
                setItems(list)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleId, sellerId, requestUrl])

    useEffect(() => {
        const ids = Object.keys(selected).filter((id) => selected[id]?.checked)
        formContext.setValue('items', ids)

        ids.forEach((id) => {
            const row = selected[id]
            formContext.setValue(`item-price-${id}`, String(row.price ?? ''))
            formContext.setValue(`item-quantity-${id}`, String(row.quantity ?? 1))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected])

    const toggleItem = (item) => {
        const id = String(item.id)
        setSelected((prev) => {
            const next = { ...prev }
            if (next[id]?.checked) {
                next[id] = { ...next[id], checked: false }
            } else {
                next[id] = {
                    checked: true,
                    price: next[id]?.price ?? itemPrice(item),
                    quantity: next[id]?.quantity ?? 1,
                }
            }
            return next
        })
    }

    const updateField = (id, field, value, item) => {
        setSelected((prev) => ({
            ...prev,
            [id]: {
                checked: true,
                price: prev[id]?.price ?? itemPrice(item),
                quantity: prev[id]?.quantity ?? 1,
                ...prev[id],
                [field]: value,
            },
        }))
    }

    if (!Number(moduleId)) {
        return null
    }

    const filterLower = filter.trim().toLowerCase()
    const visibleItems = filterLower
        ? items.filter((item) => itemTitle(item).toLowerCase().includes(filterLower))
        : items

    return (
        <Field {...props} error2={formContext.formState.errors?.items}>
            <View className="w-full gap-2 border border-border/60 rounded-xl p-3 bg-card">
                <Input
                    placeholder={t('Search')}
                    value={filter}
                    onChangeText={setFilter}
                />

                <Row className="items-center gap-2">
                    <Text className="flex-1 min-w-0 text-sm font-medium text-muted-foreground">
                        {t('Product')}
                    </Text>
                    <Text className="w-20 shrink-0 text-sm font-medium text-muted-foreground text-right">
                        {t('Price')}
                    </Text>
                    <Text className="w-24 shrink-0 text-sm font-medium text-muted-foreground text-center">
                        {t('Sold Price')}
                    </Text>
                    <Text className="w-14 shrink-0 text-sm font-medium text-muted-foreground text-center">
                        {t('Qt.')}
                    </Text>
                </Row>

                {loading ? (
                    <View className="items-center py-4">
                        <Loading />
                    </View>
                ) : visibleItems.length === 0 ? (
                    <Text className="text-sm text-muted-foreground text-center py-3">
                        {t('Nothing found')}
                    </Text>
                ) : (
                    <View className="gap-2">
                        {visibleItems.map((item) => {
                            const id = String(item.id)
                            const checked = !!selected[id]?.checked
                            const price = itemPrice(item)
                            return (
                                <Row
                                    key={id}
                                    className="items-center gap-2 py-1 border-t border-border/40"
                                >
                                    <View className="flex-1 min-w-0">
                                        <CheckBox
                                            value={checked}
                                            status={checked ? 'checked' : 'unchecked'}
                                            onPress={() => toggleItem(item)}
                                            title={itemTitle(item)}
                                        />
                                    </View>
                                    <Text className="w-20 shrink-0 text-sm text-foreground text-right">
                                        {price.toFixed(2)}
                                    </Text>
                                    <View className="w-24 shrink-0">
                                        <Input
                                            value={String(
                                                selected[id]?.price ?? price
                                            )}
                                            onChangeText={(text) =>
                                                updateField(id, 'price', text, item)
                                            }
                                            keyboardType="decimal-pad"
                                        />
                                    </View>
                                    <View className="w-14 shrink-0">
                                        <Input
                                            value={String(
                                                selected[id]?.quantity ?? 1
                                            )}
                                            onChangeText={(text) =>
                                                updateField(id, 'quantity', text, item)
                                            }
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </Row>
                            )
                        })}
                    </View>
                )}
            </View>
        </Field>
    )
}
