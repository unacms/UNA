import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthPasskey({ button }) {
    const handlePasskeyLogin = () => {
        console.log("Passkey login clicked");
        // Actual Passkey login logic will go here
    };

    return (
        <View className='flex-1 min-w-[200px]'>
            {button ? (
                <Pressable onPress={handlePasskeyLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handlePasskeyLogin} 
                    title="Use Passkey"
                    startDecorator="KeySquare" // Changed to string
                    fullWidth
                    ring="rounded-xl bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                    size="base"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 