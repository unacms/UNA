import { Button } from 'app/design/controls'

export default function BackButton({ callback, url, buttonProps }) {

    const handleBack = async () => {
        //window.history.back();
        callback();
    }
    
    return <Button {...buttonProps} onPress={() => handleBack()} />
}