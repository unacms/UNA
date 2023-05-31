import { staticDefault } from './static-default';
// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects change some specific static components here if needed

const staticComponents = staticDefault;

export function appStatic(section, name, path) {
    if (path)
        return staticComponents[section] && staticComponents[section][name] ? staticComponents[section][name][path] : '';

    return staticComponents[section] ? staticComponents[section][name] : '';
}




