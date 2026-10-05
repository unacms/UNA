import { resourcesDefault } from 'app/default/translation';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects change some specific settings here if needed
//resourcesDefault.en.translation['No comments yet'] = 'No comments yet custom'

export const resources = resourcesDefault;

// Add to the 'en' and 'ru' translation objects
// For English
if (resources.en && resources.en.translation) {
  resources.en.translation.lang_auto = 'System';
}
// For Russian
if (resources.ru && resources.ru.translation) {
  resources.ru.translation.lang_auto = 'Системный';
}
