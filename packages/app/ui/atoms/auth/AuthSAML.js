import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { SAMLIcon } from 'app/icons'; // This import might be used by the Button's internal icon resolution

export default function AuthSAML({ button }) {
    const handleSAMLLogin = () => {
        console.log("SAML login clicked");
        // Actual SAML login logic will go here
    };

    return (
        <View className='w-full'>
            {button ? (
                <Pressable onPress={handleSAMLLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleSAMLLogin} 
                    title="Continue with SAML SSO"
                    startDecorator="Lock" // Changed to string
                   
                    fullWidth
                    size="lg"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 