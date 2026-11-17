/**
 * The entry: the language's words first (one file, lib/i18n.ts), then the app (boot.tsx). A
 * module that says something as it loads gets them, because nothing of the app is evaluated
 * before they are in.
 */
import { loadLanguage } from './lib/i18n';

void loadLanguage().then(() => import('./boot'));
