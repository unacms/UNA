import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthGitHub({ button }) {
    const handleGitHubLogin = () => {
        // Actual GitHub login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            
            {button ? (
                <Pressable onPress={handleGitHubLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleGitHubLogin} 
                    title="Continue with GitHub"
                    startDecorator="GitHubIcon" // Changed to string
                
                    fullWidth
                                         size="base"
                />
            )}
                {/* Placeholder for potential error messages, similar to AuthGoogle */}
                {/* {error && <FormError errorText={error} />} */}
            
        </View>
    );
} 