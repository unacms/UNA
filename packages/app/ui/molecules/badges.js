import { Row } from 'app/design/view'
import { Button } from 'app/design/controls'
import Image from 'app/ui/atoms/image';
import Link from 'app/ui/atoms/link'
import { View } from 'app/design/view'
export default function ({ badges }) {

    if (!badges)
        return null

    return (
        <Row className='items-center gap-x-1'>
            {badges.map((item, index) => {
                if (item.badge_url) {
                    return (
                        <Link key={`badge-${item.badge_link}`} href={item.badge_link}><Button
                            key={`badge-${index}`}
                            rounded
                            startDecorator={<View className="rounded-full w-8 h-8 overflow-hidden"><Image
                                view="cover"
                                src={item.badge_url}
                                alt={item.badge_url.title_attr}
                            /></View>}
                            title={item.text}
                            size="xs"
                            variant="primary"
                        /></Link>
                    );
                } else {
                    return (
                        <Button
                            key={`badge-${index}`}
                            rounded
                            startDecorator="BadgeCheck"
                            title={item.text}
                            size="xs"
                            variant="primary"
                        />
                    );
                }
            })}
        </Row>
    )
}
