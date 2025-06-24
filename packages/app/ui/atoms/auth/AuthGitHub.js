import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthGitHub({ button }) {
    const handleGitHubLogin = () => {
        console.log("GitHub login clicked");
        // Actual GitHub login logic will go here
    };

    return (
        <View className='flex-1 min-w-[200px]'>
            
            {button ? (
                <Pressable onPress={handleGitHubLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleGitHubLogin} 
                    title="Login with GitHub"
                    startDecorator="GitHubIcon" // Changed to string
                
                    fullWidth
                    ring="rounded-[13px] bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                    size="base"
                />
            )}
                {/* Placeholder for potential error messages, similar to AuthGoogle */}
                {/* {error && <FormError errorText={error} />} */}
            
        </View>
    );
} 