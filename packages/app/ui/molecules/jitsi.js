//import {JitsiMeeting} from '@jitsi/react-native-sdk/index';
//import {JitsiMeeting} from '@jitsi/react-native-sdk/index';
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'

export default function (props) {
    return <></>
/*
    let { currentUser, setCurrentUser } = useCurrentUser();
    let userInfo = {
        email: currentUser?.email,
        displayName: currentUser?.display_name
    }
    return (
    <JitsiMeeting
        roomName = { appSetting('jitsi', 'prefix') + props.roomName } 
        serverURL={appSetting('jitsi', 'server')}
        userInfo = {userInfo}
        />
    );*/
}
