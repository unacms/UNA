import { memo } from "react";
import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each unit is its own chunk (see lib/dynamic-fallback.js).
const GeneralContentList = dynamic(() => import('./general-content-list'), { loading: DynamicFallback });
const GeneralProfileList = dynamic(() => import('./general-profile-list'), { loading: DynamicFallback });
const Comments = dynamic(() => import('./comments'), { loading: DynamicFallback });
const Activity = dynamic(() => import('./activity'), { loading: DynamicFallback });
const Notifications = dynamic(() => import('./notifications'), { loading: DynamicFallback });
const Feed = dynamic(() => import('./feed'), { loading: DynamicFallback });
const Price = dynamic(() => import('./price'), { loading: DynamicFallback });
const SearchResults = dynamic(() => import('./search-results'), { loading: DynamicFallback });
const Invitations = dynamic(() => import('./invitations'), { loading: DynamicFallback });


const GeneralContentList_ = memo(GeneralContentList)

export const componentsMapDefault = {
    'general-content-list': GeneralContentList_,
    'general-content-card': GeneralContentList_,
    'general-profile-card': GeneralContentList_,
    'general-context-card': GeneralContentList_,
    'general-profile-list': memo(GeneralProfileList),
    'mixed': GeneralContentList_,
    comments: memo(Comments),
    activity: memo(Activity),
    notifications: memo(Notifications),
    invitations: memo(Invitations),
    feed: memo(Feed),
    price: memo(Price),
    'search-results': memo(SearchResults)
};
