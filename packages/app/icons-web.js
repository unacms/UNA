'use server'

//import { IconSet as IconSetDedault } from './icons-web.default';
import * as Icons from  "@phosphor-icons/react/dist/ssr";
//import { Theme } from 'app/design/theme'
// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects change some specific static components here if needed
//let a = IconSetDedault;
/*
const IconSet = {
	'Airplane': Airplane,
	//...a
}

*/
export default async function Icon(props) {
    console.log('Icon', props);

    if (props && props.icon){
  let { icon, className, color, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let  ic = a;
    const IconComponent = Icons[ic];
    /*let ic = appSetting('theme', 'icons', a);

    if (!ic){
        a = a.charAt(0).toUpperCase() + a.slice(1);
        ic = a;
    }*/
    
   // const IconComponent = IconSet['Airplane'];
    //if (!IconComponent)
     //   console.log('Icon not found:', ic);

    return <IconComponent  color={color} className={className} {...rest}/>
    }
    return <></>
}