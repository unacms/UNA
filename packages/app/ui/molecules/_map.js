import { memo } from "react";
import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each molecule is its own chunk: fetched when a page renders it, and preloaded
// in the HTML when it was rendered during SSR (see lib/dynamic-fallback.js).
const Likes = dynamic(() => import('./objects/likes'), { loading: DynamicFallback });
const Stars = dynamic(() => import('./objects/stars'), { loading: DynamicFallback });
const Reactions = dynamic(() => import('./objects/reactions'), { loading: DynamicFallback });
const Scores = dynamic(() => import('./objects/scores'), { loading: DynamicFallback });
const Comments = dynamic(() => import('./objects/comments'), { loading: DynamicFallback });
const Features = dynamic(() => import('./objects/features'), { loading: DynamicFallback });
const Favorites = dynamic(() => import('./objects/favorites'), { loading: DynamicFallback });
const Reports = dynamic(() => import('./objects/reports'), { loading: DynamicFallback });
const Reposts = dynamic(() => import('./objects/reposts'), { loading: DynamicFallback });
const Shares = dynamic(() => import('./objects/shares'), { loading: DynamicFallback });
const Connections = dynamic(() => import('./objects/connections'), { loading: DynamicFallback });
const ConnectionsExt = dynamic(() => import('./objects/connections-ext'), { loading: DynamicFallback });
const ConnectionsMenu = dynamic(() => import('./objects/connections-menu'), { loading: DynamicFallback });
const Recommendation = dynamic(() => import('./objects/recommendations'), { loading: DynamicFallback });
const ContextSelector = dynamic(() => import('./sections/context-selector'), { loading: DynamicFallback });
const Badges = dynamic(() => import('./profile/badges'), { loading: DynamicFallback });
const Splash = dynamic(() => import('./sections/splash'), { loading: DynamicFallback });
const ConfirmEmail = dynamic(() => import('./auth/confirm-email'), { loading: DynamicFallback });
const HeaderElement = dynamic(() => import('./header/header-element'), { loading: DynamicFallback });
const CounterIndicator = dynamic(() => import('./misc/counter-indicator'), { loading: DynamicFallback });
const ProfileLink = dynamic(() => import('./profile/profile-link'), { loading: DynamicFallback });
const NoContent = dynamic(() => import('./misc/no-content'), { loading: DynamicFallback });
const TaskTimer = dynamic(() => import('./misc/task-timer').then((m) => m.TaskTimer), { loading: DynamicFallback });
// AI chat pulls @tanstack/ai* — never on pages without an agent.
const AiAgent = dynamic(() => import('./ai-agent/agent'), { loading: DynamicFallback });

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
    confirm_email: ConfirmEmail,
    badges: Badges,
    header_element: HeaderElement,
    counter_indicator: CounterIndicator,
    profile_link: ProfileLink,
    no_content: NoContent,
    task_timer: TaskTimer,
    ai_agent: AiAgent,
};
