/**
 * The app's brand, from brand/brand.json: what a client project changes to ship its own app
 * (brand/README.md). Rust reads the same file (src-tauri/src/brand.rs).
 */
import brand from '../../brand/brand.json';
import appIcon from '../../brand/app-icon.png';

/** The app's name, as titles and texts say it ("Sign in – UNA"). */
export const APP_NAME: string = brand.name;
/** The scheme of the app's links, with its colon, as URL.protocol has it (`una:`). */
export const APP_SCHEME = `${brand.scheme}:`;
/** Where Help > Report an Issue goes. */
export const ISSUES_URL: string = brand.issuesUrl;
/** The app's icon, for the sign-in screen and the splash. */
export const APP_ICON: string = appIcon;
