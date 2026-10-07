import en from './translations/en.json'
import ru from './translations/ru.json'
import es from './translations/es.json'
import de from './translations/de.json'
import fr from './translations/fr.json'

/**
 * Default i18next resources. One JSON file per language in `./translations/`;
 * add a language = add a file + one line here.
 *
 * Keep this path and export name: `customization/translation.js` in forks
 * imports `resourcesDefault` and mutates it in place.
 */
export const resourcesDefault = {
    en: { translation: en },
    ru: { translation: ru },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
}
