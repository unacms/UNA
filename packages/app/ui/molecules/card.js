import { View } from 'app/design/view'

export default function (props) {
    let margin = "";
    if (props?.margin)
        margin = props.margin;

    let rounded = "";
        if (props?.rounded)
            rounded = props.rounded;

 	return (
        <View className = {props.addClassName + " " + margin + " " + rounded + "  shadow border-bdrcard dark:border-bdrcard-d group duration-500 overflow-hidden sm:rounded-2xl  bg-bgrcard dark:bg-bgrcard-d sm:hover:bg-bgrcard-h sm:dark:hover:bg-bgrcard-dh  active:opacity-50 active:translate-y-1   "}>
            {props.children}
        </View>
    );
} 
