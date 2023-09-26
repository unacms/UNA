import { View } from 'app/design/view'
import { JitsiMeeting } from '@jitsi/react-sdk';
import { appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'

export default function (props) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    let userInfo = {
        email: currentUser?.email,
        displayName: currentUser?.display_name
    }

 	return (
        <View className='h-96'>
            <JitsiMeeting className='h-96' styles={{height:250}} 
                roomName = { appSetting('jitsi', 'prefix') + props.roomName } 
                serverURL={appSetting('jitsi', 'server')}
                getIFrameRef = { node => node.style.height = '800px' }
                userInfo = {userInfo}
            />
        </View>
    );
} 
