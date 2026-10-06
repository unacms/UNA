import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthPasskey() {
    const { t } = useTranslation();
    const handlePasskeyLogin = () => {
        // Actual Passkey login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <NeoButton
                onPress={handlePasskeyLogin}
                label={t('Use Passkey')}
                image="KeySquare"
                controlSize="large"
                width="fill"
                classNames={{ root: 'flex-none' }}
            />
        </View>
    );
} 
