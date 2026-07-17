import { memo } from "react";
import Likes from './likes';    
import Stars from './stars';    
import Reactions from './reactions';    
import Scores from './scores';  
import Comments from './comments';  
import Features from './features';  
import Favorites from './favorites';  
import Reports from './reports';    
import Reposts from './reposts';    
import Shares from './shares';  
import Connections from './connections';    
import ConnectionsExt from './connections_ext';    
import ConnectionsMenu from './connections_menu';
import Recommendation from './recommendations'; 
import ContextSelector from './context-selector';  
import Badges from './badges';  
import Splash from './splash';  
import HeaderElement from './header_element'; 
import CounterIndicator from './counter-indicator'; 
import ProfileLink from './profile-link'; 
import NoContent from './no-content'; 
import { TaskTimer } from './task-timer';
import WikiDocumentHeader from './wiki-document-header';

export const componentsMapDefault = {
    likes: memo(Likes),
    stars: (Stars),
    reactions: (Reactions),
    scores: memo(Scores),
    comments: (Comments),
    features:memo(Features),
    favorites:memo(Favorites),
    reports: memo(Reports),
    reposts: memo(Reposts),
    shares: memo(Shares),
    connections: memo(Connections),
    connections_ext: memo(ConnectionsExt),
    connections_menu: memo(ConnectionsMenu),
    recommendation: memo(Recommendation),
    context_selector: ContextSelector,
    splash: Splash,
    badges: Badges,
    header_element: HeaderElement,
    counter_indicator: CounterIndicator,
    profile_link: ProfileLink,
    no_content: NoContent,
    task_timer: TaskTimer,
    wiki_document_header: WikiDocumentHeader,
};

