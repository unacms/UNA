import { Text } from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import UniList from 'app/ui/atoms/unilist'
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import Confirm from 'app/ui/molecules/confirm';
import Msg from 'app/ui/molecules/msg';
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import React, { useEffect, useState, useMemo, useCallback, useRef, useReducer } from 'react';
import Switch from 'app/ui/atoms/switcher'
import CheckBox from 'app/ui/atoms/checkbox';
import { Input } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { stripTags } from 'app/lib/util';
import { Modal } from 'app/design/controls'
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { Icon } from 'app/ui/atoms/icon'
import Redirect from 'app/ui/atoms/redirect';
import Stripe from 'app/ui/molecules/stripe';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useInfiniteQuery } from '@tanstack/react-query'
import Loading from 'app/ui/atoms/loading'
import {
    refetchUniListReducer,
    flattenPagesForUniList,
    isSameItemsForUniList
} from 'app/lib/conductor-helpers'
import { getDataForMenu } from 'app/lib/util'
import { Platform } from 'react-native'
import { getPageData } from 'app/lib/util';

/**
 * Flex-none columns use fixed width/minWidth so header + body rows share the
 * same track sizes (content-sized flex columns diverge per row and misalign labels).
 */
const CONTROL_COL_STYLE = {
    checkbox: { flexGrow: 0, flexShrink: 0, width: 44, minWidth: 44 },
    order: { flexGrow: 0, flexShrink: 0, width: 36, minWidth: 36 },
    switcher: { flexGrow: 0, flexShrink: 0, width: 64, minWidth: 64 },
    // Fixed track for row actions (right-aligned); header label stays empty.
    actions: { flexGrow: 0, flexShrink: 0, width: 168, minWidth: 168 },
};

/** Short meta columns — fixed track (`flex-none`). */
const FLEX_NONE_NAME_RE =
    /^(date|datetime|time|added|created|changed|period|price|amount)$/i;
const META_COL_WIDTH = 108;

const ROW_GAP = 8;
const ROW_PAD_X = 16; // px-2 each side

const isFlexNoneMetaColumn = (name = '') =>
    FLEX_NONE_NAME_RE.test(name) ||
    /date|time|added|created|changed/i.test(name);

/**
 * Text columns (title, provider, …): flex-auto — share leftover space.
 * Controls / date / actions: flex-none — fixed tracks for header/body alignment.
 */
const getColumnStyle = (itemCell) => {
    const name = itemCell?.name || '';

    if (CONTROL_COL_STYLE[name]) {
        return CONTROL_COL_STYLE[name];
    }

    if (isFlexNoneMetaColumn(name)) {
        return {
            flexGrow: 0,
            flexShrink: 0,
            width: META_COL_WIDTH,
            minWidth: META_COL_WIDTH,
        };
    }

    // flex-auto text columns — grow/shrink; floor keeps a readable minimum.
    return {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 72,
    };
};

const getTableMinWidth = (columns = []) => {
    const colsMin = columns.reduce((sum, col) => {
        const style = getColumnStyle(col);
        return sum + (style.minWidth || style.width || 72);
    }, 0);
    const gaps = Math.max(0, columns.length - 1) * ROW_GAP;
    return colsMin + gaps + ROW_PAD_X;
};

/** Ensure an actions column exists (empty label) so Date/meta headers keep their track. */
const normalizeGridHeader = (rawHeader, sampleRow) => {
    const cols = (rawHeader || []).filter((item) => item?.name != 'reports');
    const hasActionsCol = cols.some((c) => c?.name === 'actions');
    const rowHasActions =
        !!sampleRow &&
        Object.values(sampleRow).some((cell) => cell?.type === 'actions');

    if (!hasActionsCol && rowHasActions) {
        cols.push({ name: 'actions', title: '' });
    }

    return cols.map((col) =>
        col?.name === 'actions' ? { ...col, title: col.title || '' } : col
    );
};

const getActionButtonIcon = (name) => {
    if (name == 'delete') return 'Trash';
    if (name == 'edit') return 'Pencil';
    if (name == 'promotion') return 'ChartLine';
    if (name == 'edit_budget') return 'Wallet';
    if (name == 'set_role') return 'UserRoundCog';
    if (name == 'actions') return 'Ellipsis';
    return false;
};

/**
 * UNA grids often ship both a text "View details" control and an `edit` icon that
 * open the same modal/url. Prefer the icon action and drop the duplicate text one.
 */
const dedupeGridRowActions = (actions) => {
    const list = (actions || []).filter((item) => item?.type);
    const edit = list.find((a) => a.name === 'edit');
    if (!edit) return list;

    const editUrl = edit.url || edit.link || '';

    return list.filter((action) => {
        if (action.name === 'edit' || action.name === 'delete') return true;
        if (getActionButtonIcon(action.name)) return true;

        const title = String(action.title || '');
        if (/view\s*details/i.test(title)) return false;
        if (editUrl && (action.url === editUrl || action.link === editUrl)) return false;

        if (
            action.type === 'modal' &&
            edit.type === 'modal' &&
            ((edit.action && edit.action === action.action) ||
                (edit.callback && edit.callback === action.callback))
        ) {
            return false;
        }

        return true;
    });
};

/** Pull grid row(s) from a UNA action API response. Always returns an array. */
const extractGridRowsFromResponse = (response) => {
    const data = response?.data;
    if (!data) return [];

    // Shape: { rows: [...] }
    if (Array.isArray(data.rows) && data.rows.length > 0) {
        return data.rows;
    }
    // Shape: { data: [...] } or { data: {...} }
    if (Array.isArray(data?.data) && data.data.length > 0) {
        return data.data;
    }
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return [data.data];
    }
    // Shape: data is a direct array of rows
    if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        // Content blocks (msg/form/redirect) are not grid rows.
        if (first?.type === 'msg' || first?.type === 'form' || first?.type === 'redirect') {
            return [];
        }
        return data;
    }
    // Shape: single row object (not a full grid payload with settings/header/rows)
    if (typeof data === 'object' && !Array.isArray(data) && !data.settings && !data.header && !data.rows) {
        return [data];
    }

    return [];
};

/** Pull a single grid row from a UNA action API response. */
const extractGridRowFromResponse = (response) => {
    const rows = extractGridRowsFromResponse(response);
    return rows[0] ?? null;
};

/** True when a row has designed cells (`{ type, … }`) from grid display API. */
const isProcessedGridRow = (row) => {
    if (!row || typeof row !== 'object') return false;
    return Object.values(row).some(
        (cell) => cell != null && typeof cell === 'object' && typeof cell.type === 'string'
    );
};

const ActionButton = React.memo(({ id, index, itemAction, setTimeStamp, setShowConfirm, deleteRows, updateRow, fetchData, handleBlock, refetch }) => {
    const [hide, setHide] = useState(false);
    const [menuData, setMenuData] = useState(false)
    const redirectRef = useRef();
    const getActionAfter = async (itemAction, response) => {

        /*if (itemAction.on_callback == 'hide') {
            setHide(true);
        }*/
        if (itemAction.on_callback == 'hide_row') {
            deleteRows([itemAction.attr.bx_grid_action_data, id]);
            return;
        }
        if (itemAction.on_callback == 'redirect') {
            redirectRef.current.redirect(itemAction.redirect_url);
            return;
        }
        if (itemAction.on_callback == 'refresh_rows') {
            const rows = extractGridRowsFromResponse(response);
            // Display API returns cells as `{ type, value|data }`. Some actions
            // return raw DB fields in `data.rows` — those need a full reload.
            if (rows.length > 0 && rows.every(isProcessedGridRow)) {
                const fallbackId = itemAction.attr?.bx_grid_action_data ?? id;
                rows.forEach((row) => {
                    const rowId = row?.id ?? fallbackId;
                    if (row && rowId != null) {
                        updateRow(rowId, row);
                    }
                });
                return;
            }
            setTimeStamp(Date.now());
            return;
        }
        if (itemAction.on_callback == 'refresh') {
            setTimeStamp(Date.now());
            return;
        }

        refetch();
    }

    const getAction = async (itemAction, setShowConfirm) => {
        if (itemAction.confirm == '1') {
            setShowConfirm({
                show: true,
                cb: async () => {
                    const response = await fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
                    getActionAfter(itemAction, response);

                }
            });
        }
        else {
            const response = await fetchData(itemAction.name, '&ids[]=' + itemAction.attr.bx_grid_action_data);
            getActionAfter(itemAction, response);
        }
    }

    let icon = getActionButtonIcon(itemAction.name);

    const excludedActions = ['clear_reports', 'set_acl_level'];

    if (excludedActions.includes(itemAction.name) || hide) {
        return <></>;
    }

    const commonProps = {
        style: 'borderless',
        controlSize: 'small',
        label: icon ? undefined : itemAction.title,
        image: icon || undefined,
        accessibilityLabel: itemAction.title,
    };

    if (itemAction.type === 'link') {
        return (
            <NeoButtonLink key={index} href={itemAction.url} {...commonProps} />
        );
    }

    if (itemAction.type === 'modal') {
        return (
            <NeoButton
                {...commonProps}
                onPress={() => {
                    handleBlock(itemAction);
                }}
            />
        );
    }

    const handleMenuManageSelect = async (oItem, event) => {
        if (oItem.display_type === "callback") {
            const handleCallback = async () => {
                const response = await fetcher('/api.php?r=' + oItem.data.request_url);
                if (oItem.data.on_callback === 'hide') {
                    setHide(true);
                } else if (oItem.data.on_callback === 'hide_row') {
                    deleteRows([oItem.data.id]);
                } else if (oItem.data.on_callback === 'refresh_row') {
                    const row = extractGridRowFromResponse(response);
                    if (row && isProcessedGridRow(row)) {
                        const rowId = row.id ?? oItem.data.id ?? id;
                        if (rowId != null) {
                            updateRow(rowId, row);
                        }
                    } else {
                        setTimeStamp(Date.now());
                    }
                } else if (oItem.data.on_callback === 'refresh') {
                    setTimeStamp(Date.now());
                }
            };

            if (oItem.data.confirm == 1) {
                setShowConfirm({
                    show: true,
                    cb: handleCallback
                });
            } else {
                await handleCallback();
            }
        }
    }

    if (itemAction.type === 'menu') {
        return (
            <>
                {!menuData ? <NeoButton
                    style="borderless"
                    controlSize="small"
                    image="Ellipsis"
                    accessibilityLabel={itemAction.title || 'Actions'}
                    onPress={() => {
                        if (Platform.OS === 'web')
                            setMenuData({
                                ...itemAction,
                                items: [{ name: 'loader' }],
                            })
                        getDataForMenu(itemAction, setMenuData)
                    }}
                /> : <DropdownMenu
                    mode="popup"
                    items={menuData.items}
                    defaultOpen={true}
                    onSelect={handleMenuManageSelect}
                >
                    <NeoButton
                        style="borderless"
                        controlSize="small"
                        image="Ellipsis"
                        accessibilityLabel={itemAction.title || 'Actions'}
                        interactive
                    />
                </DropdownMenu>}
            </>
        );
    }

    if (itemAction.type === 'object') {
        return (
            <NeoButton
                {...commonProps}
                onPress={() => {
                    handleBlock(itemAction);
                }}
            />
        );
    }

    if (itemAction.type === 'callback') {
        return (
            <>
                <Redirect ref={redirectRef} />
                <NeoButton
                    key={index}
                    {...commonProps}
                    onPress={() => getAction(itemAction, setShowConfirm)}
                />
            </>
        );
    }

});

const Cell = React.memo(({ cell, indexRow, id, toggleSwitch, setSelection, selected, setTimeStamp, setShowConfirm, deleteRows, updateRow, refetch, fetchData, handleBlock }) => {
    switch (cell?.type) {
        case 'time':
            return <Time ts={cell.data} stylesName={'text-sm text-secondary-foreground '}></Time>
        case 'datetime':
            return <Time ts={cell.data} format='datetime' stylesName={'text-xs text-secondary-foreground '}></Time>
        case 'link':
            return <Link href={cell.data.url}><Text className="text-primary">{cell.data.text}</Text></Link>
        case 'text':
            return <Text className="block max-w-full min-w-0 overflow-hidden truncate text-secondary-foreground"  numberOfLines={1}>{stripTags(cell.value)}</Text>
        case 'price':
            return <Text className="text-secondary-foreground" numberOfLines={1}>{cell.value.value + ' ' + cell.value.currency}</Text>
        case 'period':
            return <Text className="text-secondary-foreground" numberOfLines={1}>{cell.value.period + ' ' + cell.value.unit}</Text>
        case 'order':
            return (
                <View className="items-start justify-center">
                    <Icon icon="GripVertical" size={18} className="text-muted-foreground" />
                </View>
            )
        case 'switcher':
            return (
                <View className="items-start justify-center">
                    <Switch
                        size="small"
                        onValueChange={() => toggleSwitch(id, indexRow)}
                        value={cell.data == 'active' || cell.data == '1' ? true : false}
                    />
                </View>
            )
        case 'checkbox':
            return (
                <View className="items-start justify-center">
                    <CheckBox
                        value={selected.includes(cell.data)}
                        status={selected.includes(cell.data) ? 'checked' : 'unchecked'}
                        onPress={() => setSelection(cell.data)}
                        isBackground={false}
                        compact
                    />
                </View>
            )
        case 'profile':
            return <Profile {...cell.data} displaySize="sm" />
        case 'actions':
            return (
                <View className="w-full items-end justify-center">
                    <Row className="gap-1.5 items-center justify-end flex-nowrap">
                        {dedupeGridRowActions(cell.data).map((itemAction, index) => (
                            <ActionButton
                                key={"ab" + index}
                                index={index}
                                itemAction={itemAction}
                                indexRow={indexRow}
                                id={id}
                                setShowConfirm={setShowConfirm}
                                deleteRows={deleteRows}
                                updateRow={updateRow}
                                fetchData={fetchData}
                                refetch={refetch}
                                setTimeStamp={setTimeStamp}
                                handleBlock={handleBlock}
                            />
                        ))}
                    </Row>
                </View>
            )

    }
    return <Text className="text-secondary-foreground ">{JSON.stringify(cell)}</Text>
});


const MultiAdd = React.memo(({ data, setBottomSheetData, handleUpdate }) => {

    const handleAction = async (item) => {

        const fetchedData = await fetcher("/api.php?r=" + item.callback);
        let cnt = { content: fetchedData.data, designbox_id: 0 }
        setBottomSheetData({ title: cnt.content[0]?.title ? cnt.content[0]?.title : " ", content: <View className='px-1'><BlockByData onFormEmpty={() => handleUpdate()} block={cnt} /></View> });
    };

    return <DropdownMenu items={data.values} onSelect={(oItem) => { handleAction(oItem) }}>
        <NeoButton style="borderedProminent" controlSize="large" image="Plus" label={data.title} interactive />
    </DropdownMenu>
})
    ;

const FILTER_PARAM_DIVIDER = '%23-%23';
const RESERVED_FILTER_KEYS = new Set(['search']);

const isNumberedFilterKey = (key) => /^filter\d+$/.test(key);

const getDropdownFilterKeys = (filters) => {
    if (!filters) return [];
    return Object.keys(filters)
        .filter((key) => !RESERVED_FILTER_KEYS.has(key) && Array.isArray(filters[key]) && filters[key].length > 0)
        .sort((a, b) => {
            const aNum = isNumberedFilterKey(a) ? parseInt(a.replace('filter', ''), 10) : Infinity;
            const bNum = isNumberedFilterKey(b) ? parseInt(b.replace('filter', ''), 10) : Infinity;
            if (aNum !== bNum) return aNum - bNum;
            return a.localeCompare(b);
        });
};

const getNumberedFilterKeys = (keys) => keys.filter(isNumberedFilterKey);

const getQueryParamFilterKeys = (keys) => keys.filter((key) => !isNumberedFilterKey(key));

const hasSearchFilter = (filters) => filters != null && 'search' in filters;

const mapFilterDropdownItems = (items) => items.map((aItem) => ({
    id: aItem.value,
    name: aItem.title.toLowerCase(),
    title: aItem.title
}));

const buildFilterParam = (numberedFilterKeys, selectedFilters, searchValue) => {
    const parts = numberedFilterKeys.map((key) => selectedFilters[key]?.id ?? '');
    parts.push(searchValue ?? '');
    return parts.join(FILTER_PARAM_DIVIDER);
};

const buildQueryAppend = (settings, queryParamFilterKeys, selectedFilters) => {
    const append = { ...(settings?.query_append || {}) };
    queryParamFilterKeys.forEach((key) => {
        const value = selectedFilters[key]?.id;
        if (value !== undefined && value !== '') {
            append[key] = value;
        }
    });
    return append;
};

const fetchGridData = async ({ pageParam, settings, selectedFilters, numberedFilterKeys, queryAppend, searchValue }) => {
    const start = pageParam?.start || 0;
    let url = "&start=" + start;
    url += '&filter=' + buildFilterParam(numberedFilterKeys, selectedFilters, searchValue);

    let sUrl = '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=display';
    Object.keys(queryAppend).forEach((sKey) => {
        sUrl += '&' + sKey + '=' + queryAppend[sKey];
    });

    const fetchedData = await fetcher(sUrl + url);

    return {
        data: fetchedData.data?.data || [],
        settings: fetchedData.data?.settings || settings,
        params: {
            start: start,
            per_page: fetchedData.data?.settings?.per_page || settings.per_page
        }
    };
};

export default function ElementGrid(props) {

    const { setBottomSheetData } = useBottomSheetData();
    const data = props.data;
    let settings = data.settings;
    const header = useMemo(
        () => normalizeGridHeader(data.header, data.data?.[0]),
        [data.header, data.data]
    );
    const isSortable = header.find((item) => item?.name == 'order');
    const [refetchState, dispatch] = useReducer(refetchUniListReducer, {
        visibleItems: [],
        hasNewData: false
    })
    const refetchRef = useRef({
        isFirstLoad: true,
        prevItems: []
    })
    const [selected, setSelected] = useState([]);
    const [showConfirm, setShowConfirm] = useState({ show: false, cb: null });
    const [calculateMsg, setCalculateMsg] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [searchValue, setSearchValue] = useState('');
    const [timeStamp, setTimeStamp] = useState(Date.now());
    const [modalContent, setModalContent] = useState(false);
    const [modalContentElement, setModalContentElement] = useState(false);
    const { t } = useTranslation();

    const tableMinWidth = useMemo(() => getTableMinWidth(header), [header]);

    const dropdownFilterKeys = useMemo(
        () => getDropdownFilterKeys(settings.filters),
        [settings.filters]
    );

    const numberedFilterKeys = useMemo(
        () => getNumberedFilterKeys(dropdownFilterKeys),
        [dropdownFilterKeys]
    );

    const queryParamFilterKeys = useMemo(
        () => getQueryParamFilterKeys(dropdownFilterKeys),
        [dropdownFilterKeys]
    );

    const queryAppend = useMemo(
        () => buildQueryAppend(settings, queryParamFilterKeys, selectedFilters),
        [settings?.query_append, queryParamFilterKeys, selectedFilters]
    );

    const filterParam = useMemo(
        () => buildFilterParam(numberedFilterKeys, selectedFilters, searchValue),
        [numberedFilterKeys, selectedFilters, searchValue]
    );

    const queryKey = [
        'grid',
        settings.object,
        filterParam,
        JSON.stringify(queryAppend),
        timeStamp
    ];

    const {
        status,
        data: pagesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching
    } = useInfiniteQuery({
        queryKey: queryKey,
        queryFn: ({ pageParam }) => fetchGridData({
            pageParam,
            settings,
            selectedFilters,
            numberedFilterKeys,
            queryAppend,
            searchValue
        }),
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length > 0) {
                return {
                    start: lastPage.params.start + lastPage.params.per_page
                };
            }
            return undefined;
        },
        staleTime: 1000,
        initialPageParam: { start: 0 }
    });

    useEffect(() => {
        if (!pagesData) return

        const items = flattenPagesForUniList(pagesData)

        if (refetchRef.current.isFirstLoad) {
            dispatch({ type: 'SET_ITEMS', items })
            refetchRef.current.prevItems = items
            refetchRef.current.isFirstLoad = false
            return
        }

        // Update items when data changes
        dispatch({ type: 'SET_ITEMS', items })
        refetchRef.current.prevItems = items
    }, [pagesData])




    const dataItems = refetchState.visibleItems


    const deleteRows = useCallback((idsToRemove) => {

        idsToRemove.forEach(id => {
            dispatch({ type: 'REMOVE_ITEM', id: id })
        })


        if (refetchRef.current?.prevItems) {
            refetchRef.current.prevItems = refetchRef.current.prevItems.filter(item => !idsToRemove.includes(item.id))
        }

    }, [refetch]);

    const updateRow = useCallback((rowId, rowData) => {
        if (rowId == null || !rowData) return;

        const next = { ...rowData, id: rowData.id ?? rowId };
        const prev = refetchRef.current?.prevItems || [];
        const items = prev.map((item) => (item.id == rowId ? next : item));

        dispatch({ type: 'SET_ITEMS', items });
        refetchRef.current.prevItems = items;
    }, []);

    const handleDeleteSelected = () => {
        setShowConfirm({
            show: true,
            cb: () => {
                deleteRows(selected);
                fetchData('delete', '&' + selected.map(id => `ids[]=${id}`).join('&'))
            }
        });
    };

    const handleCalculateSelected = async () => {
        const response = await fetchData('calculate', '&' + selected.map(id => `ids[]=${id}`).join('&'));
        const content = Array.isArray(response?.data) ? response.data : [];
        const msgItem = content.find((item) => item?.type === 'msg');
        if (!msgItem?.data) return;

        const raw = msgItem.data;
        const text = "Calculated time: " + raw.total_f;
        if (!text) return;

        setCalculateMsg(text);
    };

    

    const handleActionBlock = async (data) => {

        if (data.type == 'modal') {
            let fetchedData = await fetchData(data.action, data.params, data.callback);
            let cnt = { content: fetchedData.data, designbox_id: 0 }
            setBottomSheetData({ title: cnt.content[0]?.title || data.title, content: <View className='px-1'><BlockByData onFormEmpty={() => handleUpdate()} block={cnt} /></View> });
        }
        if (data.type == 'object') {
            setModalContentElement(<Stripe payment_type={data.payment_type} seller_id={data.seller_id} items={data.items} />);
        }
    };

    const handleActionBlockPayment = async (type, payment_type) => {
        if (type == 'stripe_v3') {
            setModalContentElement(<Stripe payment_type={payment_type} seller_id={settings.query_append.seller_id} items={selected} />);
        }
        if (type == 'credits') {
            const fail = (msg) => {
                setCalculateMsg(msg || t('Something went wrong'));
            };

            console.log("selected", selected);

            const response = await fetchData(
                'checkout',
                '&provider=credits&seller_id=' + settings.query_append.seller_id + '&' + selected.map(id => `ids[]=${id}`).join('&')
            );

            const checkoutMsg = Array.isArray(response?.data)
                ? response.data.find((item) => item?.type === 'msg')
                : null;
            if (checkoutMsg?.data) {
                fail(typeof checkoutMsg.data === 'string' ? checkoutMsg.data : checkoutMsg.data?.msg || checkoutMsg.data?.message);
                return;
            }

            if (!response?.data?.url) {
                fail(t('Checkout URL not found'));
                return;
            }

            const response2 = await fetcher(response.data.url);
            if (!response2?.data?.url) {
                fail(t('Payment page URL not found'));
                return;
            }

            const response3 = await getPageData(response2.data.url);
            const content = response3?.data?.elements?.cell_center?.[0]?.content;
            if (!content?.length) {
                fail(t('Checkout content not found'));
                return;
            }

            setModalContent({ content, designbox_id: 0 });
        }
    };

    const handleCloseModal = () => {
        setBottomSheetData(false);
        setModalContent(false);
    };

    const handleCloseModalElement = () => {
        setModalContentElement(false);
    };

    const handleUpdate = () => {
        setTimeout(() => {
            handleCloseModal();
            setTimeStamp(Date.now());
        }, 100);
    }

    const fetchData = useCallback(async (action, params, callback) => {
        let sUrl = callback ? '/api.php?r=' + callback : '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=' + action;
        if (!callback)
            Object.keys(queryAppend).forEach((sKey) => {
                sUrl += '&' + sKey + '=' + queryAppend[sKey];
            });

        return await fetcher(sUrl + (callback ? '' : params));
    }, [settings.object, queryAppend]);

    const handleEndReached = useCallback(() => {
        if (!hasNextPage) return;
        if (isFetchingNextPage) return;
        fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    const toggleSwitch = async (id, indexRow) => {
        let bChecked = false;
        const oSwitcher = { active: 'hidden', hidden: 'active', 0: '1', 1: '0' };

        // Optimistic UI update — mutate in place
        const currentItem = dataItems[indexRow];
        if (currentItem?.switcher) {
            currentItem.switcher.data = oSwitcher[currentItem.switcher.data];
            if (currentItem.switcher.data == 'active' || currentItem.switcher.data == '1')
                bChecked = true;
        }

        // Send request to server
        await fetchData('enable', '&ids[]=' + id + (bChecked ? '&checked=1' : ''));

        // Sync from server response
        refetch();
    }
    const setSelection = (data) => {
        if (!selected.includes(data)) {
            setSelected([...selected, data]);
        }
        else {
            setSelected(selected.filter((item) => (item != data)));
        }
    }

    const handleSearch = (value) => {
        setSearchValue(value);
        setTimeStamp(Date.now());
    };

    const handleFilter = (filterKey, value) => {
        setSelectedFilters((prev) => ({ ...prev, [filterKey]: value }));
        setTimeStamp(Date.now());
    };

    const handleSort = useCallback((result) => {
        if (!result.destination) return;
        const updatedData = [...dataItems];
        const [removed] = updatedData.splice(result.source.index, 1);
        updatedData.splice(result.destination.index, 0, removed);
        fetchData('reorder', '&' + updatedData.map(item => `${settings.object}_row[]=${item.id}`).join('&'));
        refetch();
    }, [dataItems, settings, fetchData, refetch]);

    if (!data.header)
        return <></>

    const actionsBulk = Object.values(data.actions.bulk);
    const actionsIndependent = Object.values(data.actions.independent);


    /*   <Text className="tracking-tight text-lg font-bold text-popover-foreground  mb-2">{stripTags(props?.block?.title)}</Text>*/
    let a = <View className="w-full">

        {modalContent && (
            <Modal title={modalContent.content[0]?.title ? modalContent.content[0]?.title : " "} onVisible={!!modalContent} onClose={() => handleCloseModal()}>
                <View className='px-4'>
                    <BlockByData onFormEmpty={() => handleUpdate()} block={modalContent} />
                </View>
            </Modal>
        )
        }
        {modalContentElement && (
            <Modal scrollable title="Checkout" onVisible={!!modalContentElement} onClose={() => handleCloseModalElement()}>
                <View className='px-4'>
                    {modalContentElement}
                </View>
            </Modal>
        )
        }


        <Confirm onVisible={showConfirm.show} title={t("Are you sure?")} handleCancel={() => setShowConfirm({ show: false, cb: null })} handleOk={() => { setShowConfirm({ show: false, cb: null }); showConfirm.cb(); }} />
        <Msg
            onVisible={calculateMsg}
            title={calculateMsg}
            text={calculateMsg}
            handleOk={() => setCalculateMsg(false)}
        />
        <Row className="w-full flex-wrap items-center justify-between gap-3 mt-2 mb-4">
            {(dropdownFilterKeys.length > 0 || hasSearchFilter(settings.filters)) &&
                <Row className="flex-1 min-w-48 flex-wrap gap-2 items-center">
                    {dropdownFilterKeys.map((filterKey) => {
                        const items = mapFilterDropdownItems(settings.filters[filterKey]);
                        const selected = selectedFilters[filterKey];
                        return (
                            <DropdownMenu
                                key={filterKey}
                                items={items}
                                onSelect={(oItem) => handleFilter(filterKey, oItem)}
                            >
                                <NeoButton
                                    style="bordered"
                                    controlSize="small"
                                    label={selected?.title ?? items[0]?.title}
                                    interactive
                                />
                            </DropdownMenu>
                        );
                    })}
                    {hasSearchFilter(settings.filters) &&
                        <Input size="small" placeholder={t('Search')} name="search" onChangeText={(value) => handleSearch(value)} className="min-w-40 flex-1" />
                    }
                </Row>
            }
            <Row className="flex-wrap gap-2 items-center shrink-0">

                {actionsIndependent.map((item, index) => {
                    if (item.type == 'modal') {
                        return (
                            <NeoButton
                                key={`btn-${item.name}`}
                                style="borderedProminent"
                                controlSize="large"
                                image="Plus"
                                label={t(item?.title || "Add new")}
                                onPress={() => { handleActionBlock(item) }}
                            />
                        )
                    }
                    if (item.type == 'menu') {
                        return <MultiAdd key={`btn-${item.name}`} handleUpdate={handleUpdate} setBottomSheetData={setBottomSheetData} data={item} />
                    }
                    if (item.type == 'link') {
                        return (
                            <NeoButtonLink
                                key={`btn-${item.name}`}
                                href={item.link || item.url}
                                style="borderedProminent"
                                controlSize="large"
                                label={item.title}
                            />
                        )
                    }
                })}

                {actionsBulk.map((item, index) => {
                    if (item.name == 'calculate') {
                        return (
                            <NeoButton
                                key={item.name}
                                style="bordered"
                                controlSize="small"
                                label={t("Calculate")}
                                disabled={selected.length == 0}
                                onPress={() => { handleCalculateSelected() }}
                            />
                        )
                    }
                    if (item.name == 'delete') {
                        return (
                            <NeoButton
                                key={item.name}
                                style="bordered"
                                controlSize="large"
                                image="Trash"
                                label={t("Delete selected")}
                                disabled={selected.length == 0}
                                onPress={() => { handleDeleteSelected() }}
                            />
                        )
                    }
                    if (item.name == 'stripe_v3') {
                        
                        return (
                            <NeoButton
                                key={item.name}
                                style="bordered"
                                controlSize="small"
                                label={t("Checkout with Stripe")}
                                disabled={selected.length == 0}
                                onPress={() => { handleActionBlockPayment('stripe_v3', item.payment_type) }}
                            />
                        )
                    }
                    if (item.name == 'credits') {
                        return (
                            <NeoButton
                                key={item.name}
                                style="bordered"
                                controlSize="small"
                                label={t("Checkout with Credits")}
                                disabled={selected.length == 0}
                                onPress={() => { handleActionBlockPayment('credits') }}
                            />
                        )
                    }
                })}
            </Row>
        </Row>
        <ScrollView
            horizontal
            className="w-full"
            contentContainerClassName="w-full min-w-full"
            showsHorizontalScrollIndicator
        >
            <View
                className="w-full border border-border/60 rounded-lg"
                style={{ width: '100%', minWidth: tableMinWidth }}
            >
                <Row className="w-full items-center gap-2 px-2 py-2 border-b border-border/60">
                    {header.map((itemCell, index) => {
                        const isActions = itemCell.name === 'actions';
                        const label =
                            itemCell.title == 'Select' || isActions
                                ? ''
                                : itemCell.title;
                        return (
                            <View
                                key={'header' + index}
                                style={getColumnStyle(itemCell)}
                                className={`justify-center py-1 min-w-0 ${isActions ? 'items-end' : 'items-start'}`}
                            >
                                {/* Actions keeps an empty label so Date/meta stay on their tracks */}
                                <Text
                                    className="font-bold text-secondary-foreground text-left"
                                    numberOfLines={1}
                                >
                                    {label || (isActions ? ' ' : '')}
                                </Text>
                            </View>
                        );
                    })}
                </Row>
                {(!dataItems || dataItems.length === 0) && status === 'success' && !hasNextPage && (
                    <View className="items-center px-2 pt-4 pb-4">
                        <Text className="text-secondary-foreground text-center">Nothing to show</Text>
                    </View>
                )}

                <UniList
                    height={400}
                    sortable={isSortable}
                    onSort={handleSort}
                    data={dataItems}
                    onEndReached={handleEndReached}
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    ListFooterComponent={hasNextPage && isFetchingNextPage ? (
                        <View className="p-4 items-center">
                            <Loading size="small" />
                        </View>
                    ) : null}
                    renderItem={({ item, index: indexRow }) => {
                        return (
                            <Row className="w-full items-center gap-2 px-2 py-2 border-b border-border/60 web:hover:bg-muted/40">
                                {header.map((cellHeader, index) => (
                                    <View
                                        key={'cell_' + indexRow + '_' + index}
                                        style={getColumnStyle(cellHeader)}
                                        className={`justify-center min-h-9 min-w-0 ${cellHeader.name === 'actions' ? 'items-end' : 'items-start'}`}
                                    >
                                        <Cell
                                            cell={item[cellHeader.name]}
                                            indexRow={indexRow}
                                            id={item[settings.field_id]}
                                            toggleSwitch={toggleSwitch}
                                            setSelection={setSelection}
                                            selected={selected}
                                            setShowConfirm={setShowConfirm}
                                            deleteRows={deleteRows}
                                            updateRow={updateRow}
                                            fetchData={fetchData}
                                            refetch={refetch}
                                            setTimeStamp={setTimeStamp}
                                            handleBlock={handleActionBlock}
                                        />
                                    </View>
                                ))}
                            </Row>
                        );
                    }}
                />
            </View>
        </ScrollView>
    </View>;

    return <BlockWrapper {...props.blockWrapperProps}>{a}</BlockWrapper>
}
