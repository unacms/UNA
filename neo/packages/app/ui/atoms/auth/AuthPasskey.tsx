import { View } from 'app/design/view';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthPasskey() {
    const { t } = useTranslation();
    const handlePasskeyLogin = () => {
        // Actual Passkey login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <Button
                onPress={handlePasskeyLogin}
                title={t('Use Passkey')}
                startDecorator="KeySquare" // Changed to string
                fullWidth
                size="base"
            />
        </View>
    );
} 
