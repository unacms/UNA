import { View } from 'app/design/view'

type ProgressProps = {
    /** Percent, 0–100. */
    value: number;
    bgColor?: string;
    progressColor?: string;
};

export default function Progress({ value, bgColor="bg-white/30", progressColor="bg-white" }: ProgressProps) {
// TODO CHECK W/17%
    return (
        <View className={`${bgColor} h-2 w-full rounded`}>
            <View style={{width: `${value}%`}} className={`${progressColor} h-2 rounded`} />
        </View>
    );
}
