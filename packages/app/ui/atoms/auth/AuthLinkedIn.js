import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthLinkedIn({ button }) {
    const handleLinkedInLogin = () => {
        // Actual LinkedIn login logic will go here
    };

    return (
        <Button
            onPress={handleLinkedInLogin}
            title="Continue with LinkedIn"
            startDecorator="LinkedInIcon" // Changed to string

            fullWidth
            size="base"
        />
    );
} 