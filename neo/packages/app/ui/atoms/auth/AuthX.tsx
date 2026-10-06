import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';


export default function AuthX() {
    const { t } = useTranslation();
    // Placeholder logic
    const handleXLogin = () => {
        // Actual X login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <NeoButton
                onPress={handleXLogin}
                label={t('Continue with X')}
                image="XIcon"
                controlSize="large"
                width="fill"
                classNames={{ root: 'flex-none' }}
            />
        </View>
    );
} 
