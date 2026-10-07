import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { BlockWrapper } from 'app/components/block-wrapper'
import { Icon } from 'app/ui/atoms/icon'
import { cn } from 'app/lib/util'
import { useTranslation } from 'react-i18next'

const EMPTY = {}
const NUMBER_OPTIONS = { minimumFractionDigits: 0, maximumFractionDigits: 2 }
const PERCENT_OPTIONS = { minimumFractionDigits: 0, maximumFractionDigits: 1 }
const numberFormatters = new Map()
const percentFormatters = new Map()

function toNumber(value) {
    const amount = Number(value)
    return Number.isFinite(amount) ? amount : 0
}

function getFormatter(cache, locale, options, currency) {
    const key = currency ? `${locale}|${currency}` : String(locale || '')
    let formatter = cache.get(key)
    if (formatter) return formatter

    try {
        formatter = new Intl.NumberFormat(
            locale,
            currency ? { style: 'currency', currency, ...options } : options
        )
    } catch {
        formatter = new Intl.NumberFormat(undefined, options)
    }
    cache.set(key, formatter)
    return formatter
}

function formatAmount(value, locale, currency) {
    return getFormatter(numberFormatters, locale, NUMBER_OPTIONS, currency).format(toNumber(value))
}

function formatPercent(value, locale) {
    return getFormatter(percentFormatters, locale, PERCENT_OPTIONS).format(toNumber(value)) + '%'
}

function barFillClass(spentPercent, overBudget) {
    if (overBudget || spentPercent >= 90) return 'bg-destructive'
    if (spentPercent >= 70) return 'bg-primary/70'
    return 'bg-primary'
}

function Stat({ label, value }) {
    return (
        <View className="flex-1 min-w-0 gap-0.5">
            <Text className="text-xs text-muted-foreground">{label}</Text>
            <Text className="text-base font-semibold tabular-nums text-foreground">{value}</Text>
        </View>
    )
}

export default function TasksBudget({ data, blockWrapperProps }) {
    const { t, i18n } = useTranslation()
    const locale = i18n.language
    const budget = data && typeof data === 'object' && !Array.isArray(data) ? data : EMPTY

    const total = toNumber(budget.total)
    const spent = toNumber(budget.spent)
    const remains = budget.remains == null ? total - spent : toNumber(budget.remains)
    const remainsPercent = budget.remains_percent == null
        ? (total > 0 ? (remains / total) * 100 : 0)
        : toNumber(budget.remains_percent)
    const currency = budget.currency || budget.currency_code
    const spentPercent = total > 0 ? Math.min(100, Math.max(0, (spent / total) * 100)) : 0
    const overBudget = remains < 0 || spent > total
    const remainsClass = overBudget ? 'text-destructive' : 'text-foreground'

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                <Row className="items-start justify-between gap-3">
                    <View className="flex-auto min-w-0 gap-1">
                        <Row className="items-center gap-1.5">
                            <Icon icon="Wallet" size={16} className="text-muted-foreground" />
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
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    accessibilityRole="progressbar"
                    accessibilityLabel={t('tasks_budget_spent')}
                    accessibilityValue={{ min: 0, max: 100, now: Math.round(spentPercent) }}
                >
                    <View
                        className={cn('h-full rounded-full', barFillClass(spentPercent, overBudget))}
                        style={{ width: `${spentPercent}%` }}
                    />
                </View>

                <Row className="gap-4">
                    <Stat label={t('tasks_budget_total')} value={formatAmount(total, locale, currency)} />
                    <Stat label={t('tasks_budget_spent')} value={formatAmount(spent, locale, currency)} />
                </Row>
            </View>
        </BlockWrapper>
    )
}
