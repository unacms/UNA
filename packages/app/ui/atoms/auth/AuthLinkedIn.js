import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { LinkedInIcon } from 'app/icons'; // This import might be used by the Button's internal icon resolution

export default function AuthLinkedIn({ button }) {
    const handleLinkedInLogin = () => {
        console.log("LinkedIn login clicked");
        // Actual LinkedIn login logic will go here
    };

    return (
        <View className='w-full'>
            {button ? (
                <Pressable onPress={handleLinkedInLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleLinkedInLogin} 
                    title="Continue with LinkedIn"
                    startDecorator="LinkedInIcon" // Changed to string
                    
                    fullWidth
                    size="lg"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 