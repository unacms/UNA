import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';


export default function AuthX({ button }) {
    // Placeholder logic
    const handleXLogin = () => {
        console.log("X login clicked");
        // Actual X login logic will go here
    };

    return (
        <View className='flex-1 min-w-200'>
            {button ? (
                <Pressable onPress={handleXLogin}>{button}</Pressable>
            ) : (
                <Button 
                    onPress={handleXLogin} 
                    title="Continue with X"
                    startDecorator="XIcon" // Changed to string
                    
                    fullWidth
                                         size="base"
                />
            )}
            {/* {error && <FormError errorText={error} />} */}
        </View>
    );
} 