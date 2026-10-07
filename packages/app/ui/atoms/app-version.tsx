import { Text } from 'app/design/typography';

// Guarded: binaries built before expo-application was added have no native module.
let Application: any = null;
try {
    Application = require('expo-application');
} catch {
    Application = null;
}

/** Native app version + build from the installed binary, e.g. "3.3.10 (3094)". */
export default function AppVersion({ className = '' }: { className?: string }) {
    const version = Application?.nativeApplicationVersion;
    const build = Application?.nativeBuildVersion;
    if (!version) return null;

    return (
        <Text className={`text-center text-xs text-muted-foreground ${className || 'py-4'}`}>
            {build ? `${version} (${build})` : version}
        </Text>
    );
}
