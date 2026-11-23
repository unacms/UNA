import { useTranslation } from 'react-i18next';
import { appStatic } from 'app/lib/app-static';
import EmptyState from './empty-state';

/**
 * A list's empty state. With `preview` (the list's skeletons, getSkeletonPreview) it is
 * EmptyState: that preview fading out, then UNA's words and buttons for the list (`state`, the
 * list's `empty_state`), settled from the loading skeletons when `fromSkeletons`. Without it,
 * the `components_content_empty` static. `fill={false}` inside a block (a search's results): only as tall
 * as its words, as on the site.
 */
export default function NoContent({ endpoint, preview, state, fromSkeletons, fill = true }) {
     const { t } = useTranslation();
     if (preview) {
          // EmptyState no longer draws the preview (its props are deprecated): it only says the list has one.
          return <EmptyState state={state} fromSkeletons={!!fromSkeletons} fallbackTitle={t('Nothing here yet')} fill={fill} />
     }
     if (endpoint?.unit == 'feed'){
          return null
     }
     return appStatic('components_content_empty')
}
