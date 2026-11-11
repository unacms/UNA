import { useTranslation } from 'react-i18next';
import { appStatic } from 'app/lib/app-static';
import EmptyStack from './empty-stack';

/**
 * A list's empty state. With `card` (one of the list's skeleton cards, getSkeletonCard) it is
 * three of them stacked over "Nothing here yet", gathered from the skeletons when
 * `fromSkeletons`; without it, the `components_content_empty` static.
 */
export default function NoContent({ endpoint, card, fromSkeletons }) {
     const { t } = useTranslation();
     if (card) {
          return <EmptyStack card={card} fromSkeletons={!!fromSkeletons} message={t('Nothing here yet')} />
     }
     if (endpoint?.unit == 'feed'){
          return null
     }
     return appStatic('components_content_empty')
}
