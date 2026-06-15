import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthPasskey({ button }) {
    const handlePasskeyLogin = () => {
        // Actual Passkey login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <Button
                onPress={handlePasskeyLogin}
                title="Use Passkey"
                startDecorator="KeySquare" // Changed to string
                fullWidth
                size="base"
            />
        </View>
    );
} 