import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthGitHub({ button }) {
    const { t } = useTranslation();
    const handleGitHubLogin = () => {
        // Actual GitHub login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <Button
                onPress={handleGitHubLogin}
                title={t('Continue with GitHub')}
                startDecorator="GitHubIcon" // Changed to string
                fullWidth
                size="base"
            />

        </View>
    );
} 
