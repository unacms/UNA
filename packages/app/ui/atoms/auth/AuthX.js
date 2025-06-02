import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { XIcon } from 'app/icons'; // This import might be used by the Button's internal icon resolution
// import { XIcon } from 'app/icons'; // Assuming an icon will be created

export default function AuthX({ button }) {
    // Placeholder logic
    const handleXLogin = () => {
        console.log("X login clicked");
        // Actual X login logic will go here
    };

    return (
        <View className='w-full'>
            {button ? (
                <Pressable onPress={handleXLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleXLogin} 
                    title="Continue with X"
                    startDecorator="XIcon" // Changed to string
                    
                    fullWidth
                    size="lg"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 