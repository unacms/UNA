import { memo } from "react";
import Likes from './objects/likes';    
import Stars from './objects/stars';    
import Reactions from './objects/reactions';    
import Scores from './objects/scores';  
import Comments from './objects/comments';  
import Features from './objects/features';  
import Favorites from './objects/favorites';  
import Reports from './objects/reports';    
import Reposts from './objects/reposts';    
import Shares from './objects/shares';  
import Connections from './objects/connections';    
import ConnectionsExt from './objects/connections_ext';    
import ConnectionsMenu from './objects/connections_menu';
import Recommendation from './objects/recommendations'; 
import ContextSelector from './sections/context-selector';  
import Badges from './profile/badges';  
import Splash from './sections/splash';  
import HeaderElement from './header/header_element'; 
import CounterIndicator from './misc/counter-indicator'; 
import ProfileLink from './profile/profile-link'; 
import NoContent from './misc/no-content'; 
import { TaskTimer } from './misc/task-timer';

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
};

