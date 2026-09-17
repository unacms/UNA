import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { BlockWrapper } from 'app/components/block-wrapper'
import { Icon } from 'app/ui/atoms/icon'
import { cn } from 'app/lib/util'
import { useTranslation } from 'react-i18next'

function toNumber(value) {
    const amount = Number(value)
    return Number.isFinite(amount) ? amount : 0
}

function formatAmount(value, locale, currency) {
    const amount = toNumber(value)
    const isInt = Number.isInteger(amount)
    try {
        if (currency) {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                minimumFractionDigits: isInt ? 0 : 2,
                maximumFractionDigits: 2,
            }).format(amount)
        }
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: isInt ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(amount)
    } catch {
        return String(amount)
    }
}

function formatPercent(value, locale) {
    const amount = toNumber(value)
    try {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }).format(amount) + '%'
    } catch {
        return `${amount}%`
    }
}

function Stat({ label, value, valueClassName = 'text-foreground' }) {
    return (
        <View className="flex-1 min-w-0 gap-0.5">
            <Text className="text-xs text-muted-foreground">{label}</Text>
            <Text className={cn('text-base font-semibold tabular-nums', valueClassName)}>
                {value}
            </Text>
        </View>
    )
}

export default function TasksBudget({ data, blockWrapperProps }) {
    const { t, i18n } = useTranslation()
    const locale = i18n.language || undefined
    const budget = data && typeof data === 'object' && !Array.isArray(data) ? data : {}

    const total = toNumber(budget.total)
    const spent = toNumber(budget.spent)
    const remains = budget.remains == null ? total - spent : toNumber(budget.remains)
    const remainsPercent = budget.remains_percent == null
        ? (total > 0 ? (remains / total) * 100 : 0)
        : toNumber(budget.remains_percent)
    const currency = budget.currency || budget.currency_code

    const spentPercent = total > 0
        ? Math.min(100, Math.max(0, (spent / total) * 100))
        : 0
    const overBudget = remains < 0 || (total > 0 && spent > total)
    const fillClass = overBudget || spentPercent >= 90
        ? 'bg-destructive'
        : spentPercent >= 70
            ? 'bg-primary/70'
            : 'bg-primary'
    const remainsClass = overBudget ? 'text-destructive' : 'text-foreground'

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                <Row className="items-start justify-between gap-3">
                    <View className="flex-auto min-w-0 gap-1">
                        <Row className="items-center gap-1.5">
                            <Icon
                                icon="Wallet"
                                size={16}
                                className="text-muted-foreground"
                            />
                            <Text className="text-sm text-muted-foreground">
                                {t('tasks_budget_remaining')}
                            </Text>
                        </Row>
                        <Text className={cn('text-2xl font-bold tabular-nums', remainsClass)}>
                            {formatAmount(remains, locale, currency)}
                        </Text>
                    </View>
                    <View className="bg-muted rounded-full px-2 py-1">
                        <Text className={cn('text-xs font-medium tabular-nums', remainsClass)}>
                            {formatPercent(remainsPercent, locale)}
                        </Text>
                    </View>
                </Row>

                <View
                    className="h-2 w-full flex-row overflow-hidden rounded-full bg-muted"
                    accessibilityRole="progressbar"
                    accessibilityLabel={t('tasks_budget_spent')}
                    accessibilityValue={{
                        min: 0,
                        max: 100,
                        now: Math.round(spentPercent),
                    }}
                >
                    <View
                        className={cn('h-full rounded-full', fillClass)}
                        style={{
                            flexGrow: spentPercent,
                            flexShrink: 0,
                            flexBasis: 0,
                        }}
                    />
                    <View
                        className="h-full"
                        style={{
                            flexGrow: Math.max(0, 100 - spentPercent),
                            flexShrink: 0,
                            flexBasis: 0,
                        }}
                    />
                </View>

                <Row className="gap-4">
                    <Stat
                        label={t('tasks_budget_total')}
                        value={formatAmount(total, locale, currency)}
                    />
                    <Stat
                        label={t('tasks_budget_spent')}
                        value={formatAmount(spent, locale, currency)}
                    />
                </Row>
            </View>
        </BlockWrapper>
    )
}
