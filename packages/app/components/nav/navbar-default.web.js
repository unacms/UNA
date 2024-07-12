import NavbarHor from 'app/components/nav/navbar-hor'
import NavbarVer from 'app/components/nav/navbar-ver'
import NavbarMixed from 'app/components/nav/navbar-mixed'
import { getLayout } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'

export default function (props) {
    let { currentUser, setCurrentUser } = useCurrentUser()
    const layout = getLayout(currentUser);
    if(layout == 'ver')
        return <NavbarVer {...props}/>

    if(layout == 'hor')
        return <NavbarHor {...props}/>

    if(layout == 'mixed')
        return <NavbarMixed {...props}/>
}
