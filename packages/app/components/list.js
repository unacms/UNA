
import General from './lists/general';
import Comments from './lists/comments';
import Feed from './lists/feed';

const componentsMap = {
    general: General,
    comments: Comments,
    feed: Feed,
};

export default function List(props) {
    const Component = componentsMap[props.type];
    return <Component {...props} unit={props.unit ? props.unit : ''} />;
}
