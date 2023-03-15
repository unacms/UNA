
import Browse from './elements/browse';
import Form from './elements/form';
import Msg from './elements/msg';
import Entry from './elements/entry';
import Author from './elements/author';
import Actions from './elements/actions';
import Comments from './elements/comments';
import Login from './elements/login';
import Redirect from './elements/redirect';
import { Text } from 'app/design/typography';
import { LayoutData } from 'app/context/layout';
import { useContext } from 'react';

const componentsMap = {
    browse: Browse,
    form: Form,
    msg: Msg,
    entry: Entry,
    author: Author,
    actions: Actions,
    comments: Comments,
    login: Login,
    redirect: Redirect
};

export default function Element(a) {

    const { layoutData, setLayoutData } = useContext(LayoutData);

    const ElementType = componentsMap[a.type];
    if ('undefined' === typeof componentsMap[a.type])
        return <Text>Undefined element type({a.type}): {JSON.stringify(a)}</Text>;
    else{
        let el = <ElementType {...a} />
        if (setLayoutData && a.type == 'comments'){
            if (layoutData == null){
                setTimeout(() => {
                    setLayoutData(el)
                }, 100);
            }
        }
        else{
            return el;
        }
    }
}
