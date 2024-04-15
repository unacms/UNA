import { View } from 'app/design/view'

export default function (props) {
    let margin = "";
    let border = " border border-bdrcard dark:border-bdrcard-d";
    if (props?.margin)
        margin = props.margin;

    if (props?.border)
        border = props.border;

    let rounded = "";
        if (props?.rounded)
            rounded = props.rounded;

 	return (
        <View className = {props.addClassName + " " + margin + " " + rounded + ' ' + border + "  shadow-sm group duration-300 overflow-hidden rounded-3xl bg-bgrcard dark:bg-bgrcard-d sm:hover:bg-bgrcard-h sm:dark:hover:bg-bgrcard-dh "}>
            {props.children}
        </View>
    );
} 
