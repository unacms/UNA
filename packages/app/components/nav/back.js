import { useRouter, useNavigation } from 'expo-router'
import { Button } from 'app/design/controls'

export default function BackButton({ callback, url, buttonProps }) {

    const routerExpo = useRouter()
    const navigation = useNavigation();


    const handleBack = async () => {
        if (navigation.getState().index == 0)
            callback(); // fodo url
        else
            routerExpo.back()
    }
    
    return <Button {...buttonProps} onPress={() => handleBack()} />
}