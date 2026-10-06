import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthSAML() {
    const { t } = useTranslation();
    const handleSAMLLogin = () => {
        // Actual SAML login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <NeoButton
                onPress={handleSAMLLogin}
                label={t('Use SAML SSO')}
                image="Lock"
                controlSize="large"
                width="fill"
                classNames={{ root: 'flex-none' }}
            />
        </View>
    );
} 
