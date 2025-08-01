import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Tabs from 'app/ui/molecules/tabs'
import { Button, Modal } from 'app/design/controls';
import Stripe from 'app/ui/molecules/stripe';
import { useState } from 'react';
import { Icon } from 'app/ui/atoms/icon';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,

} from 'app/ui/molecules/card'
import { cd } from 'app/lib/util'

// Mock inclusions data - replace with API data when available
function getMockInclusions(tierName) {
    const baseInclusions = [
        { text: "24/7 customer support", icon: "MessageCircle" },
        { text: "SSL certificate included", icon: "Shield" },
        { text: "99.9% uptime guarantee", icon: "Clock" },
        { text: "Regular security updates", icon: "RefreshCw" },
        { text: "Mobile app access", icon: "Smartphone" }
    ];
    
    const premiumInclusions = [
        { text: "Priority customer support", icon: "Star" },
        { text: "Advanced analytics dashboard", icon: "BarChart3" },
        { text: "Custom domain support", icon: "Globe" },
        { text: "API access with 10,000 requests/month", icon: "Code" },
        { text: "Advanced integrations", icon: "Zap" }
    ];
    
    const enterpriseInclusions = [
        { text: "Dedicated account manager", icon: "User" },
        { text: "Custom feature development", icon: "Settings" },
        { text: "White-label solution", icon: "Palette" },
        { text: "Unlimited API requests", icon: "Infinity" },
        { text: "On-premise deployment option", icon: "Server" }
    ];
    
    // Return different inclusions based on tier name
    const tierLower = tierName.toLowerCase();
    if (tierLower.includes('enterprise') || tierLower.includes('pro')) {
        return enterpriseInclusions;
    } else if (tierLower.includes('premium') || tierLower.includes('plus')) {
        return premiumInclusions;
    } else {
        return baseInclusions;
    }
}

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
        <Row className={`flex-wrap ${cd('gap-md')}`}>
            {filtered.map((item, index) => {
                const firstNonEmpty = item.actions.data.find(
                    (action) => action && Object.keys(action).length > 0
                );
                return (
                    <Card className=" w-full text-left max-w-sm " key={index} >
                        <CardHeader>
                            <CardTitle>{item.level_name.value}</CardTitle>
                            <CardDescription>The perfect plan for anyone looking to get the most out of our product.</CardDescription>

                            <View className=" flex-row items-end gap-4">
                            <Text className="text-5xl font-semibold text-foreground">{item.price.value}</Text>
                            <Text className="text-base text-foreground pb-1">
                                
                                {item.period.value}
                            </Text>
                            <Text className="text-base text-foreground pb-1">
                                
                            {item.trial.value != 'none' ? 'Trial:' + item.trial.value : ''}
                            </Text>
                        </View>
                        </CardHeader>
                        <CardContent>
                        <View className="flex-col flex gap-4 border-t border-border pt-4">
                            {/* Mock inclusions data - replace with API data when available */}
                            {getMockInclusions(item.level_name.value).map((inclusion, idx) => (
                                <View key={idx} className="flex-row  items-center gap-3">
                                    <Icon 
                                        icon={inclusion.icon} 
                                        size={24} 
                                        className="text-primary mt-0.5" 
                                    />
                                    <Text className="text-base text-muted-foreground flex-1">
                                        {inclusion.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text className=" text-sm text-foreground"></Text>
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

