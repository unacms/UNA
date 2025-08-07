import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function AuthLinkedIn({ button }) {
    const handleLinkedInLogin = () => {
        console.log("LinkedIn login clicked");
        // Actual LinkedIn login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            {button ? (
                <Pressable onPress={handleLinkedInLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleLinkedInLogin} 
                    title="Login with LinkedIn"
                    startDecorator="LinkedInIcon" // Changed to string
                    
                    fullWidth
                                         size="base"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 