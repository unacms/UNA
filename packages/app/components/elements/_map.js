import Browse from './browse';
import BrowseSimple from './browse-simple';
import BrowseList from './browse-list';
import Form from './form';
import Msg from './msg';
import Login from './login';
import Redirect from './redirect';
import EntityText from './entity-text';
import EntityPoll from './entity-poll';
import EntityAttachments from './entity-attachments';
import MarketAttachments from './market-attachments';
import EntityAuthor from './entity-author';
import EntityActions from './entity-actions';
import EntityInfo from './entity-info';
import EntityCover from './entity-cover';
import ProfileMenu from './profile-menu';
import CategoriesList from './categories-list';
import FeedItem from './feed-item';
import ProfileSwitcher from './profile-switcher';
import ProfileContacts from './contacts';
import SimpleList from './simple-list';
import Lang from './lang';
import Menu from './menu';
import Grid from './grid';
import DataTable from './table';
import MultiPostForm from './multi-post-form';
import Comments from './comments';
import CommentContent from './comment-content';
import ProfileList from './profiles-list';
import Logout from './logout';
import AiAgent from './ai_agent';
import Static from './static';
import Mockup from './mockup';

import { lazyComponent } from 'app/lib/lazy-component';

// Code-split: rarely rendered or heavy blocks (third-party editors, maps, grids,
// payments, wiki, tasks, courses) load on first render instead of on every page.
// The registry contract is unchanged — these are ordinary components. Elements
// with a static `checkEmpty` (entity_text, static, table) must stay eager.
const Messenger = lazyComponent(() => import('./messenger'), { name: 'Messenger' });
const TasksMenu = lazyComponent(() => import('./tasks-menu'), { name: 'TasksMenu' });
const TasksTimers = lazyComponent(() => import('./tasks-timers'), { name: 'TasksTimers' });
const TasksList = lazyComponent(() => import('./tasks-list'), { name: 'TasksList' });
const TaskTimer = lazyComponent(() => import('./task-timer'), { name: 'TaskTimer' });
const WikiBlocks = lazyComponent(() => import('./wiki-blocks'), { name: 'WikiBlocks' });
const WikiHistory = lazyComponent(() => import('./wiki-history'), { name: 'WikiHistory' });
const Chart = lazyComponent(() => import('./chart'), { name: 'Chart' });
const Calendar = lazyComponent(() => import('./calendar'), { name: 'Calendar' });
const Map = lazyComponent(() => import('./map'), { name: 'Map' });
const SmartGrid = lazyComponent(() => import('./smart-grid'), { name: 'SmartGrid' });
const Deploy = lazyComponent(() => import('./deploy'), { name: 'Deploy' });
const StripeConnect = lazyComponent(() => import('./stripe-connect'), { name: 'StripeConnect' });
const CreditsCheckout = lazyComponent(() => import('./credits-checkout'), { name: 'CreditsCheckout' });
const PaymentOrderAdd = lazyComponent(() => import('./payment-order-add'), { name: 'PaymentOrderAdd' });
const Bundles = lazyComponent(() => import('./bundles'), { name: 'Bundles' });
const Membership = lazyComponent(() => import('./membership'), { name: 'Membership' });
const Pricing = lazyComponent(() => import('./pricing'), { name: 'Pricing' });
const CourseStructure = lazyComponent(() => import('./course-structure'), { name: 'CourseStructure' });
const EditCourseContent = lazyComponent(() => import('./edit-course-content'), { name: 'EditCourseContent' });
const ModuleStructure = lazyComponent(() => import('./module-structure'), { name: 'ModuleStructure' });
const DashboardStat = lazyComponent(() => import('./dashboard-stat'), { name: 'DashboardStat' });
const Invite = lazyComponent(() => import('./invite'), { name: 'Invite' });
const InviteInContext = lazyComponent(() => import('./invite-in-context'), { name: 'InviteInContext' });
const NotificationsSettings = lazyComponent(() => import('./notifications-settings'), { name: 'NotificationsSettings' });
const SearchSections = lazyComponent(() => import('./search-sections'), { name: 'SearchSections' });
const lazyReputation = (name) => lazyComponent(() => import('./reputation').then((m) => ({ default: m[name] })), { name });
const ReputationSummary = lazyReputation('ReputationSummary');
const ReputationWidget = lazyReputation('ReputationWidget');
const ReputationLeaderboard = lazyReputation('ReputationLeaderboard');
const ReputationLevels = lazyReputation('ReputationLevels');
const ReputationHistory = lazyReputation('ReputationHistory');
const ReputationActions = lazyReputation('ReputationActions');

export const componentsMapDefault = {
    messenger_main_page: Messenger,
    invite_in_context: InviteInContext,
    search_sections: SearchSections,
    reputation_summary: ReputationSummary,
    reputation_leaderboard: ReputationLeaderboard,
    reputation_levels: ReputationLevels,
    reputation_history: ReputationHistory,
    reputation_actions: ReputationActions,
    reputation_widget: ReputationWidget,
    tasks_menu: TasksMenu,
    tasks_timers: TasksTimers,
    tasks_list: TasksList,
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
    static: Static,
    mockup: Mockup,
};