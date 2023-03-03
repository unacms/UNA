import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button } from 'app/design/controls'

export function PostScreen() {
  return (
    <View>
        <Text>Sample Pos here11</Text>
        <Row className='flex-wrap items-start justify-between'>
        <Button title="default"  type="default" />
        <Button title="primary"  type="primary"  />
        <Button title="danger" type="danger"/>
        <Button title="text" type="text"/>
        <Button title="link" type="link"/>
        <Button title="outline" type="outline"/>

        <Button title="disabled" disabled />
        
        <Button title="iconed" icon ="lala" />

        <Button title="sm" icon="home" size ="sm" />
        <Button title="base" icon="home" size ="base" />
        <Button title="lg" icon="home" size ="lg" />
    </Row>
        <Button title="full" full ="full" />

    </View>
  

    
  )
}
