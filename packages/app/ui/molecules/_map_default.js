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
import Recommendation from './recommendations'; 
import ContextSelector from './context-selector';  

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
    recommendation: memo(Recommendation),
    context_selector: ContextSelector,
};

