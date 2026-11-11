import { useTranslation } from 'react-i18next';
import { appStatic } from 'app/lib/app-static';
import EmptyState from './empty-state';

/**
 * A list's empty state. With `preview` (the list's skeletons, getSkeletonPreview) it is
 * EmptyState: that preview fading out, then UNA's words and buttons for the list (`state`, the
 * list's `empty_state`), settled from the loading skeletons when `fromSkeletons`. Without it,
 * the `components_content_empty` static.
 */
export default function NoContent({ endpoint, preview, previewScale, state, fromSkeletons }) {
     const { t } = useTranslation();
     if (preview) {
          return <EmptyState preview={preview} previewScale={previewScale} state={state} fromSkeletons={!!fromSkeletons} fallbackTitle={t('Nothing here yet')} />
     }
     if (endpoint?.unit == 'feed'){
          return null
     }
     return appStatic('components_content_empty')
}
