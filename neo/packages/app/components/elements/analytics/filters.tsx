import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { BlockWrapper } from 'app/components/block-wrapper';
import { cn, isWeb } from 'app/lib/util';
import type { AnalyticsElementProps, AnalyticsOption, FiltersReport } from './analytics.types';
import { useAnalyticsFilters, useAnalyticsReport, getStrings } from './use-analytics';
import { fillPlaceholder, formatNumber } from './format';

/** Menu id of the empty value ("All platforms"). */
const ALL = '_all';

function OptionPicker({ label, options, value, icon, onChange }: {
    label: string;
    options: AnalyticsOption[];
    value: string;
    icon: string;
    onChange: (value: string) => void;
}) {
    const current = options.find((option) => option.value === value) ?? options[0];
    if (!current) return null;

    return (
        <DropdownMenu
            items={options.map((option) => ({
                id: option.value || ALL,
                key: option.value || ALL,
                name: option.value || ALL,
                title: option.title,
                selected: option.value === current.value,
            }))}
            onSelect={(item) => onChange(item.id === ALL ? '' : String(item.id ?? ''))}
            triggerAccessibilityLabel={`${label}: ${current.title}`}
        >
            <NeoButton
                label={current.title}
                style="bordered"
                image={icon}
                accessibilityLabel={`${label}: ${current.title}`}
                interactive
            />
        </DropdownMenu>
    );
}

/** Period and platform pickers, active dimension filters and visitors online. */
export default function AnalyticsFilters({ data, blockWrapperProps }: AnalyticsElementProps) {
    const strings = getStrings(data);
    const { filters, setRange, setPlatform, removeFilter } = useAnalyticsFilters();
    const { report, hidden, isUpdating } = useAnalyticsReport<FiltersReport>(data);

    if (hidden) return null;

    const ranges = data?.ranges ?? [];
    const platforms: AnalyticsOption[] = [{ value: '', title: strings.all_platforms }, ...(data?.platforms ?? [])];
    // Chips follow the filter state, so they change at once; the report (which can still be the
    // previous filters' while the new one loads) only gives them readable labels.
    const chips = Object.entries(filters.f).map(([name, value]) =>
        report?.chips.find((chip) => chip.name === name && chip.value === value) ?? { name, value, title: name, label: value });

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className="w-full flex-wrap items-center gap-2">
                <OptionPicker label={strings.range} options={ranges} value={filters.range} icon="Calendar" onChange={setRange} />
                <OptionPicker label={strings.platform} options={platforms} value={filters.platform} icon="Smartphone" onChange={setPlatform} />
                {chips.map((chip) => (
                    <NeoButton
                        key={chip.name}
                        style="bordered"
                        controlSize="small"
                        label={`${chip.title}: ${chip.label}`}
                        image="X"
                        imagePlacement="trailing"
                        accessibilityLabel={fillPlaceholder(strings.remove_filter, `${chip.title}: ${chip.label}`)}
                        expoUI={false}
                        onPress={() => removeFilter(chip.name)}
                    />
                ))}
                {report ? (
                    <Row
                        className={cn('ms-auto items-center gap-2 py-2', isUpdating && 'opacity-60')}
                        // One stop on native; web can't name a div without a role and reads the texts.
                        {...(isWeb ? {} : {
                            accessible: true,
                            accessibilityLabel: `${formatNumber(report.online)} ${fillPlaceholder(strings.online, report.window)}`,
                        })}
                    >
                        <View className="h-2 w-2 rounded-full bg-green" />
                        <Text className="text-sm font-semibold text-foreground">{formatNumber(report.online)}</Text>
                        <Text className="text-sm text-muted-foreground">{fillPlaceholder(strings.online, report.window)}</Text>
                    </Row>
                ) : null}
            </Row>
        </BlockWrapper>
    );
}
