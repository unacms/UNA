import NavbarHor from 'app/components/nav/navbar-hor'
import NavbarVer from 'app/components/nav/navbar-ver'
import { appSetting } from 'app/lib/util'
export default function (props) {
    
    if(appSetting('layout', 'theme') == 'twitter')
        return <NavbarVer {...props}/>

    if(appSetting('layout', 'theme') == 'facebook')
        return <NavbarHor {...props}/>
}
