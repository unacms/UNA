import { View, Row } from 'app/design/view'
import Tabs from 'app/ui/molecules/tabs'
import { Modal } from 'app/design/controls';
import Stripe from 'app/ui/molecules/stripe';
import { useState, useRef } from 'react';
import { cd } from 'app/lib/util'
import { getComponent } from 'app/components/registry';
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'
import { fetcher } from 'app/lib/fetcher';
import Redirect from 'app/ui/atoms/redirect';

export default function ElementPricing({ data }) {
    const { t } = useTranslation()
    const preparedTabs = [];

    const periodMap = new Map();
    data.data.forEach(item => {
        const periodValue = item?.period?.value;
        if (periodValue) {
            const key = `${periodValue.unit}`;
            periodMap.set(key, periodValue);
        }
    });
    const periodSet = [...periodMap.values()];

    const order = ["year", "month"];

    const sorted = periodSet.sort((a, b) => {
        return order.indexOf(a.unit) - order.indexOf(b.unit);
    });


    if (sorted.length == 1)
        return <ElementPricingPeriod data={data.data} period={sorted[0]} unit={data.settings.unit} settings={data.settings} />

    sorted.forEach(item => {
        preparedTabs.push({
            key: `tab_${item.unit}`,
            title: item.unit ? t('price-period-' + item.unit) : t('price-period-lifetime'),

            content: <ElementPricingPeriod data={data.data} period={item} unit={data.settings.unit} settings={data.settings} />
        });
    });

    return (
        <>
            {appStatic('components_pricing_header')}
            <Tabs tabs={preparedTabs} activeTab={preparedTabs[0].key} />
            {appStatic('components_pricing_footer')}
        </>
    )
}

function ElementPricingPeriod({ data, period, unit, settings }) {
    const redirectRef = useRef();
    const filtered = data.filter(item => item?.period?.value.unit === period.unit);
    const [showModal, setShowModal] = useState(false);

    const fetchData = async (ids) => {
        let sUrl = '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=buy&ids[]=' + ids;
        console.log("sUrlsUrl", sUrl)
        if (settings?.query_append)
            Object.keys(settings.query_append).forEach((sKey) => {
                sUrl += '&' + sKey + '=' + settings.query_append[sKey];
            });

        return await fetcher(sUrl);
    };


    const getAction = async (data) => {
        if (data.object_name == "stripe_v3") {
            setShowModal(data)
        }

        if (data.type == "callback") {
            fetchData(data.items.join(''));
            redirectRef.current.redirect(data.redirect_url);
        }
    }

    return (
        <View className={`${unit !== 'productlist' ? 'flex-row p-3 gap-3': ''} flex-wrap ` }>
            <Redirect ref={redirectRef} />
            {filtered.map((item, index) => {
                const Price = getComponent('unit', 'price');
                return (
                    <Price data={item} unit={unit} key={index} onBuy={getAction} />
                )
            })}
            {showModal && <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
                <Stripe seller_id={showModal.seller_id} items={showModal.items} />
            </Modal>}
        </View>
    );
}

