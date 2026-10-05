import { BlockWrapper } from 'app/components/block-wrapper'
import { Button } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { CardList } from 'app/ui/molecules/page/card'
import { useTranslation } from 'react-i18next'
import { useRouter, redirectTo } from 'app/lib/hooks/router'

function ElementBundle({ data }) {
    const { t } = useTranslation()
    const router = useRouter();
    const handlePurchase = async () => {
        const res = await fetcher('/api.php?r=' + data.buttons[0].request_url);
        if (res.data.url) {
            redirectTo(router, res.data.url);
        }
        else{
            redirectTo(router, '/payment-cart?seller_id=38');
        }
    }

    return (
        <CardList className="w-[250px]" padding="p-3 sm:p-2 items-center gap-y-4">
            <Text className="font-semibold text-4xl tracking-tight text-secondary-foreground">{data.title}</Text>
            <Row><Text className="text-2xl font-semibold text-foreground">{t(data.currency_code)} {data.price}</Text></Row>
            <Button variant="primary" fullWidth title={data.buttons[0].title} onPress={handlePurchase} />
        </CardList>
    )
}


export default function ElementBundles({ data, blockWrapperProps, url }) {

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className=" gap-3 flex-wrap justify-center">
                {
                    data.map((item, index) => {
                        return <ElementBundle key={item.id || item.name || item.title || index} data={item} />
                    })
                }
            </Row>
        </BlockWrapper>
    );
}
