import { staticComponents } from 'app/static';

export function appStatic(section, name, path) {
    if (path)
        return staticComponents[section] && staticComponents[section][name] ? staticComponents[section][name][path] : '';

    return staticComponents[section] ? staticComponents[section][name] : '';
}