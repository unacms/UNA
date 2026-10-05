import { View } from 'app/design/view';
import { ContentMore } from 'app/ui/molecules/content/content-more';
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useTranslation } from 'react-i18next'

export default function ({data, blockWrapperProps}) {
    const { t } = useTranslation()
    return (
        <BlockWrapper {...blockWrapperProps}><View className="w-full px-3 sm:px-4">
            <ContentMore numberOfSymbols={360} showLess={true} content={data.text} numberOfLines={3} openSmall={false} customClassName="u-vanilla-html-small" />
            <Link href={data.link}>
                <Button size="sm" title={t('View all comments')} variant="link" endDecorator="ChevronRight"/>
            </Link>
        </View></BlockWrapper>
    );
}

