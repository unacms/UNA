import { View } from 'app/design/view'

export default function (props) {
    let margin = "mb-4 sm:mx-2";
    if (props?.margin)
        margin = props.margin;

 	return (
        <View className = {props.addClassName + " " + margin + "  group duration-200 overflow-hidden sm:rounded-2xl shadow-sm bg-backgroundcard dark:bg-backgroundcard-dark sm:hover:bg-backgroundcard-hover sm:dark:hover:bg-backgroundcard-darkhover sm:hover:shadow-lg active:opacity-80 active:translate-y-0.5 border border-bordercolorcard dark:border-bordercolorcard-dark sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover"}>
            {props.children}
        </View>
    );
} 
