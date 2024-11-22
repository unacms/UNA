import { View, Row } from 'app/design/view'

export default function Youtube({ videoId, size }) {
    return (
        <View className={`aspect-video rounded sm:rounded-lg mt-3 ${size=='small' && 'max-w-xs'}`}>
            <iframe className="absolute inset-0 w-full h-full" src={"https://www.youtube.com/embed/" + videoId} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        </View>
    )
}
