import { registerAll } from 'app/components/registry-init'
import { Root } from 'app/root'
import PlaygroundProviders from '../../playground-providers'

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
        <PlaygroundProviders>
            <Root
                settings={null}
                path="play"
                data={data}
                uri="play"
                url="/play"
                code={200}
            />
        </PlaygroundProviders>
    )
}
