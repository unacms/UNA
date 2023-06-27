import GeneralContentList from './general-content-list';
import GeneralProfileList from './general-profile-list';
import Comments from './comments';
import Notifications from './notifications';
import Feed from './feed';
import SearchResults from './search-results';

export const componentsMapDefault = {
    'general-content-list': GeneralContentList,
    'general-content-card': GeneralContentList,
    'general-profile-card': GeneralContentList,
    'general-context-card': GeneralContentList,
    'general-profile-list': GeneralProfileList,
    comments: Comments,
    notifications: Notifications,
    feed: Feed,
    'search-results': SearchResults
};

