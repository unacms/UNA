import { View, Row } from 'app/design/view';
import AuthGoogle from 'app/ui/atoms/auth/google';
import AuthGitHub from 'app/ui/atoms/auth/AuthGitHub';
import AuthLinkedIn from 'app/ui/atoms/auth/AuthLinkedIn';
import AuthX from 'app/ui/atoms/auth/AuthX';
import AuthPasskey from 'app/ui/atoms/auth/AuthPasskey';
import AuthSAML from 'app/ui/atoms/auth/AuthSAML';
import { appSetting } from 'app/lib/util'

export default function AuthPanel ({ googleButton, className }) {
    if (appSetting('auth', 'enabled') !== true) return null;
    
    return (
        <View className={`flex-row flex-wrap gap-x-[8px] gap-y-[8px] w-full ${className}`}>
            {appSetting('auth', 'google') && <AuthGoogle button={googleButton}/>}
            {appSetting('auth', 'github') && <AuthGitHub button={googleButton} />}
            {appSetting('auth', 'linkedin') && <AuthLinkedIn button={googleButton} />}
            {appSetting('auth', 'x') && <AuthX button={googleButton} />}
            {appSetting('auth', 'passkey') && <AuthPasskey button={googleButton} />}
            {appSetting('auth', 'saml') && <AuthSAML button={googleButton} />}
        </View>
    );
}