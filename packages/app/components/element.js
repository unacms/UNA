
import Browse from './elements/browse';
import Form from './elements/form';
import Msg from './elements/msg';
import Entry from './elements/entry';
import Author from './elements/author';
import Actions from './elements/actions';
import Comments from './elements/comments';
import { Text } from 'app/design/typography';

const componentsMap = {
    browse: Browse,
    form: Form,
    msg: Msg,
    entry: Entry,
    author: Author,
    actions: Actions,
    comments: Comments
};

export default function Element(a) {
    const ElementType = componentsMap[a.type];
    if ('undefined' === typeof componentsMap[a.type])
        return <Text>Undefined element type({a.type}): {JSON.stringify(a)}</Text>;
    else
        return <ElementType {...a} />;
}
