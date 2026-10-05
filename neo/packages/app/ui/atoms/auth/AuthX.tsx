import { View } from 'app/design/view';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';


export default function AuthX() {
    const { t } = useTranslation();
    // Placeholder logic
    const handleXLogin = () => {
        // Actual X login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <Button 
                    onPress={handleXLogin} 
                    title={t('Continue with X')}
                    startDecorator="XIcon" // Changed to string
                    
                    fullWidth
                                         size="base"
                />
        </View>
    );
} 
