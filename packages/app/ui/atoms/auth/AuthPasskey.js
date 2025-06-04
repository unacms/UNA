import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthPasskey({ button }) {
    const handlePasskeyLogin = () => {
        console.log("Passkey login clicked");
        // Actual Passkey login logic will go here
    };

    return (
        <View className='w-full'>
            {button ? (
                <Pressable onPress={handlePasskeyLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handlePasskeyLogin} 
                    title="Continue with Passkey"
                    startDecorator="KeySquare" // Changed to string
                    fullWidth
                    size="lg"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 