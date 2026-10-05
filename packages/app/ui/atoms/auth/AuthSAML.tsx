import { View } from 'app/design/view';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthSAML() {
    const { t } = useTranslation();
    const handleSAMLLogin = () => {
        // Actual SAML login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <Button
                onPress={handleSAMLLogin}
                title={t('Use SAML SSO')}
                startDecorator="Lock" // Changed to string
                fullWidth
                size="base"
            />
        </View>
    );
} 
