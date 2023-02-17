
import GeneralContentList from './units/general-content-list';
import GeneralContentCart from './units/general-content-card';
import GeneralProfileCart from './units/general-profile-card';
import GeneralContextCart from './units/general-context-card';
import Comments from './units/comments';
import Feed from './units/feed';

const componentsMap = {
    'general-content-list': GeneralContentList,
    'general-content-card': GeneralContentCart,
    'general-profile-card': GeneralProfileCart,
    'general-context-card': GeneralContextCart,
    comments: Comments,
    feed: Feed,
};

export default function List(props) {
    const Component = componentsMap[props.unit];
    console.log(props.unit);
    return <Component {...props} />;
}
