
import Browse from './elements/browse';
import Form from './elements/form';
import Msg from './elements/msg';
import Comments from './elements/comments';
import Login from './elements/login';
import Redirect from './elements/redirect';
import { Text } from 'app/design/typography';
import { LayoutData } from 'app/context/layout';
import { useContext } from 'react';

import EntityText from './elements/entity_text';
import EntityAttachments from './elements/entity_attachments';
import EntityAuthor from './elements/entity_author';
import EntityActions from './elements/entity_actions';
import EntityInfo from './elements/entity_info';
import EntityCover from './elements/entity_cover';

import ProfileMenu from './elements/profile_menu';

const componentsMap = {
    browse: Browse,
    form: Form,
    msg: Msg,
    comments: Comments,
    login: Login,
    redirect: Redirect,
    entity_text: EntityText,
    entity_author: EntityAuthor,
    entity_actions: EntityActions,
    entity_attachments: EntityAttachments,
    entity_info: EntityInfo,
    entity_cover: EntityCover,
    profile_menu: ProfileMenu
};

export default function Element(a) {

    const { layoutData, setLayoutData } = useContext(LayoutData);

    const ElementType = componentsMap[a.type];
    if ('undefined' === typeof componentsMap[a.type])
        return <Text>Undefined element type({a.type}): {JSON.stringify(a)}</Text>;
    else{
        let el = <ElementType  type={a.type} {...a} />
        return el;
        /*if (setLayoutData && a.type == 'comments'){
            if (layoutData == null){
                setTimeout(() => {
                    setLayoutData(el)
                }, 100);
            }
        }
        else{
            
        }*/
    }
}
