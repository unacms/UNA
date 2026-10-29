import { appSetting } from 'app/lib/util';

/** Pause in typing before a search-as-you-type field sends its request; `config.search_debounce_ms`. */
export const SEARCH_DEBOUNCE_MS: number = appSetting('config', 'search_debounce_ms') ?? 300;
