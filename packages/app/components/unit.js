
import GeneralContentList from './units/general-content-list';
// import GeneralContentCart from './units/general-content-card';
// import GeneralProfileCart from './units/general-profile-card';
// import GeneralContextCart from './units/general-context-card';
import Comments from './units/comments';
import Notifications from './units/notifications';
import Feed from './units/feed';

const componentsMap = {
    'general-content-list': GeneralContentList,
    'general-content-card': GeneralContentList,
    'general-profile-card': GeneralContentList,
    'general-context-card': GeneralContentList,
    comments: Comments,
    notifications: Notifications,
    feed: Feed,
};

export default function List(props) {
    const Component = componentsMap[props.unit];
    return <Component {...props} />;
}
