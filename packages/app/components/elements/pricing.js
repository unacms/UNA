import { View, Row } from 'app/design/view'
import Tabs from 'app/ui/molecules/tabs'
import { Modal } from 'app/design/controls';
import Stripe from 'app/ui/molecules/stripe';
import { useState } from 'react';
import { cd } from 'app/lib/util'
import { getComponent } from 'app/components/registry';
import { appStatic } from 'app/lib/app-static'

export default function ElementPricing({ data }) {

    const preparedTabs = [];
    const periodSet = new Set();
    data.data.forEach(item => {
        const periodValue = item?.period?.value;
        if (periodValue) {
            periodSet.add(periodValue);
        }
    });

    periodSet.forEach(item => {
        preparedTabs.push({
            key: `tab_${item}`,
            title: item,

            content: <ElementPricingPeriod data={data.data} name={item} />
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

function ElementPricingPeriod({ data, name }) {
    const filtered = data.filter(item => item?.period?.value === name);
    const [showModal, setShowModal] = useState(false);
    return (
        <Row className={`flex-wrap ${cd('gap-md')}`}>
            {filtered.map((item, index) => {
                const Price = getComponent('unit', 'price');
                return (
                    <Price data={item} key={index} onBuy={setShowModal}/>
                )
            })}
            {showModal && <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
                <Stripe seller_id={showModal.seller_id} items={showModal.items} />
            </Modal>}
        </Row>
    );
}

