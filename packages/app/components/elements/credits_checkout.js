'use client'

import { useRef, useState } from 'react'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByDataInt as BlockByData } from 'app/components/block'
import { fetcher } from 'app/lib/fetcher'
import Redirect from 'app/ui/atoms/redirect'
import { useTranslation } from 'react-i18next'

function formatMoney(value, currency = 'USD') {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return ''
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return `${currency} ${amount.toFixed(2)}`
    }
}

function formatCredits(value) {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return ''
    return amount.toFixed(2)
}

function resolveCreditsAmount(amount, rate) {
    const value = Number(amount?.value)
    if (!Number.isFinite(value)) return 0
    const parsedRate = parseFloat(rate)
    if (Number.isFinite(parsedRate) && parsedRate > 0) {
        return value * parsedRate
    }
    return value
}

function resolveRequestUrl(requestUrl) {
    if (!requestUrl) return null
    const apiPhpIndex = requestUrl.indexOf('api.php')
    if (apiPhpIndex !== -1) {
        return '/' + requestUrl.slice(apiPhpIndex).replace(/^api\.php\/\?/, 'api.php?')
    }
    if (requestUrl.startsWith('/')) return requestUrl
    return '/api.php?r=' + requestUrl
}

/** UNA content blocks (msg/form/redirect) returned as data array. */
function getContentBlocks(data) {
    if (Array.isArray(data) && data.length > 0 && data[0]?.type) {
        return data
    }
    return null
}

function CreditsIcon() {
    return (
        <View className="w-5 h-5 rounded-full border border-muted-foreground/50 items-center justify-center">
            <Text className="text-[10px] leading-none font-semibold text-muted-foreground">C</Text>
        </View>
    )
}

export default function CreditsCheckout({ blockWrapperProps, data, onFormEmpty }) {
    const { t } = useTranslation()
    const redirectRef = useRef()
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)
    const [resultContent, setResultContent] = useState(null)

    const items = Array.isArray(data?.items) ? data.items : []
    const priceLabel = formatMoney(data?.amount?.value, data?.amount?.currency)
    const creditsLabel = formatCredits(resolveCreditsAmount(data?.amount, data?.rate))
    const requestUrl = resolveRequestUrl(data?.request_url)

    const applyPayload = (payload) => {
        const blocks = getContentBlocks(payload)
        if (blocks) {
            setResultContent(blocks)
            return true
        }

        if (payload?.msg) {
            setErrorMsg(payload.msg)
            return true
        }

        if (payload?.redirect) {
            onFormEmpty?.()
            redirectRef.current?.redirect(payload.redirect)
            return true
        }

        return false
    }

    const handleCheckout = async () => {
        if (!requestUrl || loading) return

        setLoading(true)
        setErrorMsg(null)
        try {
            const response = await fetcher(requestUrl)
            const payload = response?.data

            if (applyPayload(payload)) return

            // Success with follow-up API call (e.g. bx_payment/finalize_checkout).
            if (payload?.request_url) {
                const finalizeUrl = resolveRequestUrl(payload.request_url)
                if (!finalizeUrl) return

                const finalizeResponse = await fetcher(finalizeUrl)
                if (applyPayload(finalizeResponse?.data)) return

                onFormEmpty?.()
            }
        } finally {
            setLoading(false)
        }
    }

    if (resultContent) {
        return (
            <BlockWrapper {...blockWrapperProps}>
                <View className="gap-4 px-1">
                    <BlockByData
                        onFormEmpty={onFormEmpty}
                        block={{ content: resultContent, designbox_id: 0 }}
                    />
                    <View className="items-center">
                        <Button
                            variant="default"
                            title={t('OK')}
                            onPress={() => onFormEmpty?.()}
                        />
                    </View>
                </View>
            </BlockWrapper>
        )
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Redirect ref={redirectRef} />
            <View className="border border-border/60 rounded-xl bg-card p-4 gap-3 max-w-md mx-auto w-full">
                {!!data?.title && (
                    <Text className="text-muted-foreground">{data.title}</Text>
                )}

                {items.length > 0 ? (
                    <View className="gap-1">
                        {items.map((item, index) => {
                            const n = item?.item_index ?? index + 1
                            const title = item?.item_title || ''
                            const qty = item?.item_quantity || ''
                            return (
                                <Text
                                    key={`${item?.sp || 'item'}-${n}-${title}`}
                                    className="text-foreground"
                                >
                                    {`${n}. ${title}${qty ? ` ${qty}` : ''}`}
                                </Text>
                            )
                        })}
                    </View>
                ) : null}

                <View className="border-t border-border/60" />

                <View className="gap-2">
                    <Row className="items-center justify-between gap-3">
                        <Text className="text-muted-foreground">{t('Price')}:</Text>
                        <Text className="text-foreground text-base">{priceLabel}</Text>
                    </Row>
                    <Row className="items-start justify-between gap-3">
                        <Text className="text-muted-foreground">{t('In Credits')}:</Text>
                        <View className="items-end gap-0.5">
                            <CreditsIcon />
                            <Text className="text-foreground text-base">{creditsLabel}</Text>
                        </View>
                    </Row>
                </View>

                <View className="border-t border-border/60" />

                {!!errorMsg && (
                    <View className="bg-destructive/10 rounded-lg px-3 py-2">
                        <Text className="text-destructive text-center">{errorMsg}</Text>
                    </View>
                )}

                <View className="items-center pt-1">
                    <Button
                        variant="default"
                        title={t('Checkout')}
                        disabled={loading || !requestUrl}
                        onPress={handleCheckout}
                    />
                </View>
            </View>
        </BlockWrapper>
    )
}
