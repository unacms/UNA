import { View } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthGitHub() {
    const { t } = useTranslation();
    const handleGitHubLogin = () => {
        // Actual GitHub login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <NeoButton
                onPress={handleGitHubLogin}
                label={t('Continue with GitHub')}
                image="GitHubIcon"
                controlSize="large"
                width="fill"
                classNames={{ root: 'flex-none' }}
            />

        </View>
    );
} 
