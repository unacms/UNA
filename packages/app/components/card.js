import { View } from 'app/design/view'

export default function (props) {
    let margin = "mb-4 mx-4 sm:mx-2";
    if (props?.margin)
        margin = props.margin;

 	return (
        <View className = {props.addClassName + " " + margin + " group duration-200 overflow-hidden rounded-md bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover hover:shadow-sm active:shadow-none active:translate-y-0.5 border border-bordercolorcard dark:border-bordercolorcard-dark sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive"}>
            {props.children}
        </View>
    );
} 
