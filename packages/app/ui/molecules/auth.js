import { Row } from 'app/design/view';
import AuthGoogle from 'app/ui/atoms/auth/google';
import { appSetting } from 'app/lib/util'

export default function AuthPanel ({ googleButton, className }) {
    if (appSetting('auth', 'enabled') !== true) return null;
    
    return (
        <Row className={`gap-x-3 ${className}`}>
            {appSetting('auth', 'google') && <AuthGoogle button={googleButton}/>}
        </Row>
    );
}