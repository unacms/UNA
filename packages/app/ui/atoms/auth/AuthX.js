import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';


export default function AuthX({ button }) {
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
