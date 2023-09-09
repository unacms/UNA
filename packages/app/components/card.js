import { View } from 'app/design/view'

export default function (props) {
    let margin = "";
    if (props?.margin)
        margin = props.margin;

    let rounded = "";
        if (props?.rounded)
        rounded = props.rounded;

 	return (
        <View className = {props.addClassName + " " + margin + " " + rounded + "  group duration-200 overflow-hidden sm:rounded-2xl shadow-sm bg-backgroundcard dark:bg-backgroundcard-dark sm:hover:bg-backgroundcard-hover sm:dark:hover:bg-backgroundcard-darkhover sm:hover:shadow-lg active:opacity-80 active:translate-y-0.5   "}>
            {props.children}
        </View>
    );
} 
