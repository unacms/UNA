import { registerAll } from 'app/components/registry-init'
import { Root } from 'app/root'

registerAll()

const data = {
    uri: 'play',
    url: '/play',
    title: 'Play',
    layout: 'play',
    elements: {},
}

export default function PlayScreen() {
    return (
        <Root
            settings={null}
            path="play"
            data={data}
            uri="play"
            url="/play"
            code={200}
        />
    )
}
