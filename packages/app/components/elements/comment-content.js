import { View } from 'app/design/view';
import { ContentMore } from 'app/ui/molecules/content/content-more';
import { NeoButtonLink } from 'app/design/controls';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useTranslation } from 'react-i18next'

export default function ({data, blockWrapperProps}) {
    const { t } = useTranslation()
    return (
        <BlockWrapper {...blockWrapperProps}><View className="w-full px-3 sm:px-4">
            <ContentMore numberOfSymbols={360} showLess={true} content={data.text} numberOfLines={3} openSmall={false} customClassName="u-vanilla-html-small" />
            <NeoButtonLink href={data.link} style="borderless" controlSize="small" label={t('View all comments')} image="ChevronRight" imagePlacement="trailing" classNames={{ root: 'mt-1' }} />
        </View></BlockWrapper>
    );
}

