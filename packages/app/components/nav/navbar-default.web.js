import NavbarHor from 'app/components/nav/navbar-hor'
import NavbarVer from 'app/components/nav/navbar-ver'
import NavbarMixed from 'app/components/nav/navbar-mixed'

const layouts = {
    ver: NavbarVer,
    hor: NavbarHor,
    mixed: NavbarMixed,
};


export default function (props) {
    const LayoutComponent = layouts[props.pageLayoutName];
    return LayoutComponent ? <LayoutComponent {...props} /> : null;
}
