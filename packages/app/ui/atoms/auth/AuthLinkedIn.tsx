import { NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthLinkedIn() {
    const { t } = useTranslation();
    const handleLinkedInLogin = () => {
        // Actual LinkedIn login logic will go here
    };

    return (
        <NeoButton
            onPress={handleLinkedInLogin}
            label={t('Continue with LinkedIn')}
            image="LinkedInIcon"
            controlSize="large"
            width="fill"
        />
    );
} 
