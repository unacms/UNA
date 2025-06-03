import { appSetting } from 'app/lib/util';
export default function ({src_web, src_dark, src_default, ...props}) {

 	return (
        <img {...props} src={appSetting('config', 'native_app_images_url') + '/svg/' + src_web}/>
    );
} 
