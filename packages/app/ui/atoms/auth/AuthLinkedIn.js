import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function AuthLinkedIn({ button }) {
    const { t } = useTranslation();
    const handleLinkedInLogin = () => {
        // Actual LinkedIn login logic will go here
    };

    return (
        <Button
            onPress={handleLinkedInLogin}
            title={t('Continue with LinkedIn')}
            startDecorator="LinkedInIcon" // Changed to string

            fullWidth
            size="base"
        />
    );
} 
