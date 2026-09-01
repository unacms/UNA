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
import DashboardStat from './dashboard-stat';
import SmartGrid from './smart-grid';
import ProfileContacts from './contacts';
import SimpleList from './simple-list';
import Membership from './membership';
import Lang from './lang';
import Invite from './invite';
import Map from './map';
import Menu from './menu';
import Deploy from './deploy';
import Calendar from './calendar';
import Grid from './grid';
import DataTable from './table';
import Pricing from './pricing';
import Chart from './chart';
import MultiPostForm from './multi-post-form';
import InviteInContext from './invite-in-context';
import Comments from './comments';
import CommentContent from './comment-content';
import NotificationsSettings from './notifications-settings';
import CourseStructure from './course-structure';
import ModuleStructure from './module-structure';
import EditCourseContent from './edit-course-content';
import Messenger from './messenger';
import ProfileList from './profiles-list';
import { ReputationSummary, ReputationWidget, ReputationLeaderboard, ReputationLevels, ReputationHistory, ReputationActions } from './reputation';
import SearchSections from './search-sections';
import StripeConnect from './stripe-connect';
import Bundles from './bundles';
import Logout from './logout';
import TasksMenu from './tasks-menu';
import TasksTimers from './tasks-timers';
import TasksList from './tasks-list';
import TaskTimer from './task-timer';
import WikiBlocks from './wiki-blocks';
import WikiHistory from './wiki-history';
import CreditsCheckout from './credits-checkout';
import PaymentOrderAdd from './payment-order-add';
import AiAgent from './ai_agent';


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
    ai_agent: AiAgent
};