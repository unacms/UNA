import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthGitHub({ button }) {
    const handleGitHubLogin = () => {
        console.log("GitHub login clicked");
        // Actual GitHub login logic will go here
    };

    return (
        <View className='w-full'>
            {button ? (
                <Pressable onPress={handleGitHubLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleGitHubLogin} 
                    title="Continue with GitHub"
                    startDecorator="GitHubIcon" // Changed to string
                
                    fullWidth
                    size="lg"
                />
            )}
            {/* Placeholder for potential error messages, similar to AuthGoogle */}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 