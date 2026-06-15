import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthSAML({ button }) {
    const handleSAMLLogin = () => {
        // Actual SAML login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            <Button
                onPress={handleSAMLLogin}
                title="Use SAML SSO"
                startDecorator="Lock" // Changed to string
                fullWidth
                size="base"
            />
        </View>
    );
} 