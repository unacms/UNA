import { pushProvidersDefault } from 'app/lib/push/providers';

// Push providers by name (app/lib/push). A fork adds its own here and names it in
// `notifications.push_provider` (customization/settings.js):
// pushProvidersDefault.mine = myProvider; // an object with the PushProvider methods (app/lib/push/types.ts)

export const pushProviders = pushProvidersDefault;
