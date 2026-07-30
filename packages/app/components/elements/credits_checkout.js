'use client'

import { useRef, useState } from 'react'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'
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

    const items = Array.isArray(data?.items) ? data.items : []
    const priceLabel = formatMoney(data?.amount?.value, data?.amount?.currency)
    const creditsLabel = formatCredits(resolveCreditsAmount(data?.amount, data?.rate))

    const handleCheckout = async () => {
        if (!data?.request_url || loading) return

        setLoading(true)
        setErrorMsg(null)
        try {
            const response = await fetcher(data.request_url)
            const payload = response?.data

            if (payload?.msg) {
                setErrorMsg(payload.msg)
                return
            }

            if (payload?.redirect) {
                onFormEmpty?.()
                redirectRef.current?.redirect(payload.redirect)
            }
        } finally {
            setLoading(false)
        }
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
                        disabled={loading || !data?.request_url}
                        onPress={handleCheckout}
                    />
                </View>
            </View>
        </BlockWrapper>
    )
}
