import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthSAML({ button }) {
    const handleSAMLLogin = () => {
        console.log("SAML login clicked");
        // Actual SAML login logic will go here
    };

    return (
        <View className='flex-1 min-w-[200px]'>
            {button ? (
                <Pressable onPress={handleSAMLLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleSAMLLogin} 
                    title="Sign in with SAML SSO"
                    startDecorator="Lock" // Changed to string
                    ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                    fullWidth
                    size="base"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 