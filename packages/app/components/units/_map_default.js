import { memo } from "react";
import GeneralContentList from './general-content-list';
import GeneralProfileList from './general-profile-list';
import Comments from './comments';
import Notifications from './notifications';
import Feed from './feed';
import Price from './price';
import SearchResults from './search-results';

const GeneralContentList_ = memo(GeneralContentList)

export const componentsMapDefault = {
    'general-content-list': GeneralContentList_,
    'general-content-card': GeneralContentList_,
    'general-profile-card': GeneralContentList_,
    'general-context-card': GeneralContentList_,
    'general-profile-list': memo(GeneralProfileList),
    'mixed': GeneralContentList_,
    comments: memo(Comments),
    notifications: memo(Notifications),
    feed: memo(Feed),
    price: memo(Price),
    'search-results': memo(SearchResults)
};

