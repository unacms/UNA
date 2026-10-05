import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Elements with a static `checkEmpty` (read by block.tsx before render) stay
// eager — a dynamic() wrapper does not carry statics.
import EntityText from './entity-text';
import DataTable from './table';
import Static from './static';
import Mockup from './mockup';

// Everything else is its own chunk: fetched when a page renders it, and
// preloaded in the HTML when it was rendered during SSR (see lib/dynamic-fallback.js).
const Browse = dynamic(() => import('./browse'), { loading: DynamicFallback });
const BrowseSimple = dynamic(() => import('./browse-simple'), { loading: DynamicFallback });
const BrowseList = dynamic(() => import('./browse-list'), { loading: DynamicFallback });
const Form = dynamic(() => import('./form'), { loading: DynamicFallback });
const Msg = dynamic(() => import('./msg'), { loading: DynamicFallback });
const Login = dynamic(() => import('./login'), { loading: DynamicFallback });
const Redirect = dynamic(() => import('./redirect'), { loading: DynamicFallback });
const EntityPoll = dynamic(() => import('./entity-poll'), { loading: DynamicFallback });
const EntityAttachments = dynamic(() => import('./entity-attachments'), { loading: DynamicFallback });
const MarketAttachments = dynamic(() => import('./market-attachments'), { loading: DynamicFallback });
const EntityAuthor = dynamic(() => import('./entity-author'), { loading: DynamicFallback });
const EntityActions = dynamic(() => import('./entity-actions'), { loading: DynamicFallback });
const EntityInfo = dynamic(() => import('./entity-info'), { loading: DynamicFallback });
const EntityCover = dynamic(() => import('./entity-cover'), { loading: DynamicFallback });
const ProfileMenu = dynamic(() => import('./profile-menu'), { loading: DynamicFallback });
const CategoriesList = dynamic(() => import('./categories-list'), { loading: DynamicFallback });
const FeedItem = dynamic(() => import('./feed-item'), { loading: DynamicFallback });
const ProfileSwitcher = dynamic(() => import('./profile-switcher'), { loading: DynamicFallback });
const ProfileContacts = dynamic(() => import('./contacts'), { loading: DynamicFallback });
const SimpleList = dynamic(() => import('./simple-list'), { loading: DynamicFallback });
const Lang = dynamic(() => import('./lang'), { loading: DynamicFallback });
const Menu = dynamic(() => import('./menu'), { loading: DynamicFallback });
const Grid = dynamic(() => import('./grid'), { loading: DynamicFallback });
const MultiPostForm = dynamic(() => import('./multi-post-form'), { loading: DynamicFallback });
const Comments = dynamic(() => import('./comments'), { loading: DynamicFallback });
const CommentContent = dynamic(() => import('./comment-content'), { loading: DynamicFallback });
const ProfileList = dynamic(() => import('./profiles-list'), { loading: DynamicFallback });
const Logout = dynamic(() => import('./logout'), { loading: DynamicFallback });
const AiAgent = dynamic(() => import('./ai_agent'), { loading: DynamicFallback });
const AiAgentsAdmin = dynamic(() => import('./ai_agents_admin'), { loading: DynamicFallback });
const Messenger = dynamic(() => import('./messenger'), { loading: DynamicFallback });
const TasksMenu = dynamic(() => import('./tasks-menu'), { loading: DynamicFallback });
const TasksTimers = dynamic(() => import('./tasks-timers'), { loading: DynamicFallback });
const TasksList = dynamic(() => import('./tasks-list'), { loading: DynamicFallback });
const TasksBudget = dynamic(() => import('./tasks-budget'), { loading: DynamicFallback });
const TaskTimer = dynamic(() => import('./task-timer'), { loading: DynamicFallback });
const WikiBlocks = dynamic(() => import('./wiki-blocks'), { loading: DynamicFallback });
const WikiHistory = dynamic(() => import('./wiki-history'), { loading: DynamicFallback });
const Chart = dynamic(() => import('./chart'), { loading: DynamicFallback });
const Calendar = dynamic(() => import('./calendar'), { loading: DynamicFallback });
const Map = dynamic(() => import('./map'), { loading: DynamicFallback });
const SmartGrid = dynamic(() => import('./smart-grid'), { loading: DynamicFallback });
const Deploy = dynamic(() => import('./deploy'), { loading: DynamicFallback });
const StripeConnect = dynamic(() => import('./stripe-connect'), { loading: DynamicFallback });
const CreditsCheckout = dynamic(() => import('./credits-checkout'), { loading: DynamicFallback });
const PaymentOrderAdd = dynamic(() => import('./payment-order-add'), { loading: DynamicFallback });
const Bundles = dynamic(() => import('./bundles'), { loading: DynamicFallback });
const Membership = dynamic(() => import('./membership'), { loading: DynamicFallback });
const Pricing = dynamic(() => import('./pricing'), { loading: DynamicFallback });
const CourseStructure = dynamic(() => import('./course-structure'), { loading: DynamicFallback });
const EditCourseContent = dynamic(() => import('./edit-course-content'), { loading: DynamicFallback });
const ModuleStructure = dynamic(() => import('./module-structure'), { loading: DynamicFallback });
const DashboardStat = dynamic(() => import('./dashboard-stat'), { loading: DynamicFallback });
const Invite = dynamic(() => import('./invite'), { loading: DynamicFallback });
const InviteInContext = dynamic(() => import('./invite-in-context'), { loading: DynamicFallback });
const NotificationsSettings = dynamic(() => import('./notifications-settings'), { loading: DynamicFallback });
const SearchSections = dynamic(() => import('./search-sections'), { loading: DynamicFallback });
const SearchAi = dynamic(() => import('./search-ai'), { loading: DynamicFallback });
// Named exports of one module (one chunk): the loader resolves to the component itself.
const ReputationSummary = dynamic(() => import('./reputation').then((m) => m.ReputationSummary), { loading: DynamicFallback });
const ReputationWidget = dynamic(() => import('./reputation').then((m) => m.ReputationWidget), { loading: DynamicFallback });
const ReputationLeaderboard = dynamic(() => import('./reputation').then((m) => m.ReputationLeaderboard), { loading: DynamicFallback });
const ReputationLevels = dynamic(() => import('./reputation').then((m) => m.ReputationLevels), { loading: DynamicFallback });
const ReputationHistory = dynamic(() => import('./reputation').then((m) => m.ReputationHistory), { loading: DynamicFallback });
const ReputationActions = dynamic(() => import('./reputation').then((m) => m.ReputationActions), { loading: DynamicFallback });

export const componentsMapDefault = {
    messenger_main_page: Messenger,
    invite_in_context: InviteInContext,
    search_sections: SearchSections,
    search_ai: SearchAi,
    reputation_summary: ReputationSummary,
    reputation_leaderboard: ReputationLeaderboard,
    reputation_levels: ReputationLevels,
    reputation_history: ReputationHistory,
    reputation_actions: ReputationActions,
    reputation_widget: ReputationWidget,
    tasks_menu: TasksMenu,
    tasks_timers: TasksTimers,
    tasks_list: TasksList,
    tasks_budget: TasksBudget,
    task_timer: TaskTimer,
    wiki_add_block: WikiBlocks,
    wiki_add_page: WikiBlocks,
    wiki_history: WikiHistory,
    chart: Chart,
    bundles: Bundles,
    membership: Membership,
    comment_content:CommentContent,
    browse: Browse,
    browse_simple: BrowseSimple,
    browse_list: BrowseList,
    grid: Grid,
    table: DataTable,
    pricing: Pricing,
    invite: Invite,
    map: Map,
    menu: Menu,
    deploy: Deploy,
    logout: Logout,
    calendar: Calendar,
    comments: Comments,
    form: Form,
    msg: Msg,
    login: Login,
    redirect: Redirect,
    entity_text: EntityText,
    credits_checkout:CreditsCheckout,
    payment_order_add: PaymentOrderAdd,
    entity_poll: EntityPoll,
    entity_author: EntityAuthor,
    entity_actions: EntityActions,
    entity_attachments: EntityAttachments,
    market_attachments: MarketAttachments,
    entity_info: EntityInfo,
    entity_cover: EntityCover,
    profile_menu: ProfileMenu,
    profile_switcher: ProfileSwitcher,
    bento_grid: SmartGrid,
    feed_item: FeedItem,
    notifications_settings: NotificationsSettings,
    dashboard_stat: DashboardStat,
    categories_list: CategoriesList,
    course_structure: CourseStructure,
    edit_course_content: EditCourseContent,
    module_structure: ModuleStructure,
    lang: Lang,
    profiles_list: ProfileList,
    raw: Lang,
    html: Lang,
    custom: Lang,
    get_block_contacts_messenger: ProfileContacts,
    get_create_post_form: MultiPostForm,
    simple_list: SimpleList,
    stripe_connect: StripeConnect,
    ai_agent: AiAgent,
    ai_agents_admin: AiAgentsAdmin,
    static: Static,
    mockup: Mockup,
};
