import RftTextTentap from './editor-inner';
import RftTextEnriched from './editor-inner-enriched';
import { appSetting } from 'app/lib/util';

export default function RftText(props) {
    const engine = appSetting('editor', 'engine');
    return engine === 'enriched'
        ? <RftTextEnriched {...props} />
        : <RftTextTentap {...props} />;
}
