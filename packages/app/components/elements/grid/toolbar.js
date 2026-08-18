import { useTranslation } from 'react-i18next';
import { Row } from 'app/design/view';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import { Input } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { hasSearchFilter, mapFilterDropdownItems } from './filters';
import { useGrid } from './context';

/** Shared chrome for independent toolbar actions (add / menu / link) — same row, same size. */
const INDEPENDENT_BUTTON = {
    style: 'borderedProminent',
    controlSize: 'regular',
};

const BULK_BUTTON = {
    style: 'bordered',
    controlSize: 'regular',
};

/**
 * Independent "add" action that opens a dropdown of create callbacks
 * (each loads a form into the bottom sheet).
 */
function MultiAdd({ data }) {
    const openGridModal = useGrid((state) => state.openGridModal);

    return (
        <DropdownMenu
            items={data.values}
            onSelect={(item) => openGridModal({ callback: item.callback, title: ' ' })}
        >
            <NeoButton {...INDEPENDENT_BUTTON} image="Plus" label={data.title} interactive />
        </DropdownMenu>
    );
}

/**
 * UNA `actions.bulk` is a list of `{ name, … }`. Only calculate / delete /
 * Stripe / credits are rendered; anything else is skipped.
 * Handlers read the selection from the store, so nothing is passed down.
 */
function BulkGridButton({ item }) {
    const { t } = useTranslation();
    const deleteSelected = useGrid((state) => state.deleteSelected);
    const calculateSelected = useGrid((state) => state.calculateSelected);
    const checkoutSelected = useGrid((state) => state.checkoutSelected);

    switch (item.name) {
        case 'calculate':
            return (
                <NeoButton {...BULK_BUTTON} label={t('Calculate')} onPress={calculateSelected} />
            );
        case 'delete':
            return (
                <NeoButton {...BULK_BUTTON} image="Trash" label={t('Delete')} onPress={deleteSelected} />
            );
        case 'stripe_v3':
            return (
                <NeoButton
                    {...BULK_BUTTON}
                    label={t('Checkout with Stripe')}
                    onPress={() => checkoutSelected('stripe_v3', item.payment_type)}
                />
            );
        case 'credits':
            return (
                <NeoButton
                    {...BULK_BUTTON}
                    label={t('Checkout with Credits')}
                    onPress={() => checkoutSelected('credits')}
                />
            );
        default:
            return null;
    }
}

/**
 * Independent toolbar controls (`modal` button, `menu` dropdown, `link`).
 * Type switch — not a props map like bulk buttons.
 */
function IndependentGridButton({ item }) {
    const { t } = useTranslation();
    const openGridModal = useGrid((state) => state.openGridModal);

    switch (item.type) {
        case 'modal':
            return (
                <NeoButton
                    {...INDEPENDENT_BUTTON}
                    image="Plus"
                    label={t(item?.title || 'Add new')}
                    onPress={() => openGridModal(item)}
                />
            );
        case 'menu':
            return (
                <MultiAdd data={item} />
            );
        case 'link':
            return (
                <NeoButtonLink
                    href={item.link || item.url}
                    {...INDEPENDENT_BUTTON}
                    label={item.title}
                />
            );
        default:
            return null;
    }
}

/**
 * Grid chrome: bulk actions (only when rows are selected), filters/search,
 * and independent add/link actions.
 */
export default function GridToolbar({
    actionsBulk,
    actionsIndependent,
    dropdownFilterKeys,
    settings,
    selectedFilters,
    handleFilter,
    handleSearch,
}) {
    const { t } = useTranslation();
    /** Boolean selector — the toolbar only re-renders when the selection empties or fills. */
    const hasSelection = useGrid((state) => state.selected.size > 0);

    return (
        <Row className="w-full flex-wrap items-center justify-between gap-3 mt-2 mb-4">
            {/* Bulk actions operate on the current selection, so they lead the toolbar
                and stay hidden until something is selected rather than sitting disabled. */}
            {hasSelection ? (
                <Row className="flex-wrap gap-2 items-center shrink-0">
                    {actionsBulk.map((item) => (
                        <BulkGridButton key={item.name} item={item} />
                    ))}
                </Row>
            ) : null}
            {(dropdownFilterKeys.length > 0 || hasSearchFilter(settings.filters)) ? (
                <Row className="flex-1 min-w-48 flex-wrap gap-2 items-center">
                    {dropdownFilterKeys.map((filterKey) => {
                        const items = mapFilterDropdownItems(settings.filters[filterKey]);
                        const selectedFilter = selectedFilters[filterKey];
                        return (
                            <DropdownMenu
                                key={filterKey}
                                items={items}
                                onSelect={(oItem) => handleFilter(filterKey, oItem)}
                            >
                                <NeoButton
                                    style="bordered"
                                    controlSize="small"
                                    label={selectedFilter?.title ?? items[0]?.title}
                                    interactive
                                />
                            </DropdownMenu>
                        );
                    })}
                    {hasSearchFilter(settings.filters) ? (
                        <Input size="small" placeholder={t('Search')} name="search" onChangeText={handleSearch} className="min-w-40 flex-1" />
                    ) : null}
                </Row>
            ) : null}
            <Row className="flex-wrap gap-2 items-center shrink-0">
                {actionsIndependent.map((item) => (
                    <IndependentGridButton key={`btn-${item.name}`} item={item} />
                ))}
            </Row>
        </Row>
    );
}
