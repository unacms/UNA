import { Button } from 'app/design/controls'
import { useRouter, useNavigation, goBack } from 'app/lib/hooks/router'

export default function BackButton({ callback, url, buttonProps }) {
    const router = useRouter()
    const navigation = useNavigation();

    return <Button {...buttonProps} onPress={() => goBack(navigation, router, callback)} />
}