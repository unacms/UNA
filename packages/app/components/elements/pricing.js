import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Tabs from 'app/ui/molecules/tabs'
import { Button, Modal } from 'app/design/controls';
import Stripe from 'app/ui/molecules/stripe';
import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,

} from 'app/ui/molecules/card'
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
        <Tabs tabs={preparedTabs} activeTab={preparedTabs[0].key} />
    )
}

function ElementPricingPeriod({ data, name }) {
    const filtered = data.filter(item => item?.period?.value === name);
    const [showModal, setShowModal] = useState(false);
    return (
        <Row className="flex-wrap gap-md">
            {filtered.map((item, index) => {
                const firstNonEmpty = item.actions.data.find(
                    (action) => action && Object.keys(action).length > 0
                );
                return (
                    <Card key={item.key}>
                        <CardHeader>
                            <CardTitle>{item.level_name.value}</CardTitle>
                            <CardDescription>{item.period.value}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Text className=" text-sm text-foreground">{item.price.value}</Text>
                            <Text className=" text-sm text-foreground">{item.trial.value != 'none' ? 'Trial:' + item.trial.value : ''}</Text>
                            <Button variant="primary" title={firstNonEmpty.title} onPress={() => { setShowModal(firstNonEmpty) }} /></CardContent>
                    </Card>
                )
            })}
            {showModal && <Modal onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
                <Stripe seller_id={showModal.seller_id} items={showModal.items} />
            </Modal>}
        </Row>
    );
}

