import { View, Row } from 'app/design/view'
import Tabs from 'app/ui/molecules/tabs'
import { Modal } from 'app/design/controls';
import Stripe from 'app/ui/molecules/stripe';
import { useState } from 'react';
import { cd } from 'app/lib/util'
import { getComponent } from 'app/components/registry';
import { appStatic } from 'app/lib/app-static'
import { useTranslation } from 'react-i18next'

export default function ElementPricing({ data }) {
    console.log("data", data)
    const { t } = useTranslation()
    const preparedTabs = [];

    const periodMap = new Map();
    data.data.forEach(item => {
        const periodValue = item?.period?.value;
        if (periodValue) {
            const key = `${periodValue.period}-${periodValue.unit}`;
            periodMap.set(key, periodValue);
        }
    });
    const periodSet = [...periodMap.values()];

    const order = ["year", "month"];

    const sorted = periodSet.sort((a, b) => {
        return order.indexOf(a.unit) - order.indexOf(b.unit);
    });


    if (sorted.length == 1)
        return <ElementPricingPeriod data={data.data} period={sorted[0]} unit={data.settings.unit} />

    sorted.forEach(item => {
        preparedTabs.push({
            key: `tab_${item.unit}_${item.period}`,
            title: t('price-period-' + item.unit + '-' + item.period),

            content: <ElementPricingPeriod data={data.data} period={item} unit={data.settings.unit} />
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

function ElementPricingPeriod({ data, period, unit }) {
    const filtered = data.filter(item => item?.period?.value.period === period.period && item?.period?.value.unit === period.unit);
    const [showModal, setShowModal] = useState(false);
    return (
        <Row className="flex-wrap gap-3 p-3">
            {filtered.map((item, index) => {
                const Price = getComponent('unit', 'price');
                return (
                    <Price data={item} unit={unit} key={index} onBuy={setShowModal} />
                )
            })}
            {showModal && <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
                <Stripe seller_id={showModal.seller_id} items={showModal.items} />
            </Modal>}
        </Row>
    );
}

