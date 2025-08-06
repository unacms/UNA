import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Tabs from 'app/ui/molecules/tabs'
import { Button, Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from 'app/ui/molecules/card'
import { useCurrentUser } from 'app/context/user';
import Link from 'app/ui/atoms/link'

export default function UniPrice({ data, onBuy }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const firstNonEmpty = data.actions.data.find(
        (action) => action && Object.keys(action).length > 0
    );

    const LevelDescriptions = {
        'Premium': 'Premium -The perfect plan for anyone looking to get the most out of our product.',
        'Platinum': 'Platinum -The perfect plan for anyone looking to get the most out of our product.'
    }

    const LevelFeatures = {
        'Premium': [
            { text: "24/7 customer support", icon: "MessageCircle" },
            { text: "SSL certificate included", icon: "Shield" },
            { text: "99.9% uptime guarantee", icon: "Clock" },
            { text: "Regular security updates", icon: "RefreshCw" },
            { text: "Mobile app access", icon: "Smartphone" }
        ],
        'Platinum': [
            { text: "Priority customer support", icon: "Star" },
            { text: "Advanced analytics dashboard", icon: "BarChart3" },
            { text: "Custom domain support", icon: "Globe" },
            { text: "API access with 10,000 requests/month", icon: "Code" },
            { text: "Advanced integrations", icon: "Zap" }
        ]
    }

    const LevelName = data.level_name.value;

    return (
        <Card className=" w-full text-left max-w-sm "  >
            <CardHeader>
                <CardTitle>{LevelName}</CardTitle>
                <CardDescription>{LevelDescriptions[LevelName]}</CardDescription>

                <View className=" flex-row items-end gap-4">
                    <Text className="text-5xl font-semibold text-foreground">{data.price.value.replace("&#36;", "$ ")}</Text>
                    <Text className="text-base text-foreground pb-1">

                        {data.period.value}
                    </Text>
                    <Text className="text-base text-foreground pb-1">

                        {data.trial.value != 'none' ? 'Trial:' + data.trial.value : ''}
                    </Text>
                </View>
            </CardHeader>
            <CardContent>
                <View className="flex-col flex gap-4 border-t border-border pt-4">
                    {LevelFeatures[LevelName].map((inclusion, idx) => (
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
                {currentUser ? <Button variant="primary" title={firstNonEmpty.title} onPress={() => { onBuy(firstNonEmpty) }} /> : 
                <Link href="/create-account"><Button variant="primary" title='Create  account'  /></Link>}

            </CardContent>
        </Card>
    )
}
