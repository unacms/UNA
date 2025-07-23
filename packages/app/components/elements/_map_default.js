import Browse from './browse';
import Form from './form';
import Msg from './msg';
import Login from './login';
import Redirect from './redirect';
import EntityText from './entity_text';
import EntityPoll from './entity_poll';
import EntityAttachments from './entity_attachments';
import EntityAuthor from './entity_author';
import EntityActions from './entity_actions';
import EntityInfo from './entity_info';
import EntityCover from './entity_cover';
import ProfileMenu from './profile_menu';
import CategoriesList from './categories_list';
import FeedItem from './feed_item';
import ProfileSwitcher from './profile_switcher';
import DashboardStat from './dashboard_stat';
import SmartGrid from './smart_grid';
import ProfileContacts from './contacts';
import SimpleList from './simple_list';
import Lang from './lang';
import Invite from './invite';
import Map from './map';
import Calendar from './calendar';
import Grid from './grid';
import Chart from './chart';
import MapBox from './mapbox';
import MultiPostForm from './multi_post_form';
import Comments from './comments';
import CommentContent from './comment_content';
import NotificationsSettings from './notifications_settings';
import CourseStructure from './course_structure';
import ModuleStructure from './module_structure';
import EditCourseContent from './edit_course_content';
import Messenger from './messenger';
import ProfileList from './profiles_list';
import { ReputationSummary, ReputationWidget, ReputationLeaderboard, ReputationLevels, ReputationHistory, ReputationActions } from './reputation';
import SearchSections from './search_sections';
import StripeConnect from './stripe_connect';
import ApiPerformance from './api_performance';

export const componentsMapDefault = {
    messenger_main_page: Messenger,
    search_sections: SearchSections,
    reputation_summary: ReputationSummary,
    reputation_leaderboard: ReputationLeaderboard,
    reputation_levels: ReputationLevels,
    reputation_history: ReputationHistory,
    reputation_actions: ReputationActions,
    reputation_widget: ReputationWidget,
    chart: Chart,
    comment_content:CommentContent,
    browse: Browse,
    grid: Grid,
    invite: Invite,
    map: Map,
    calendar: Calendar,
    comments: Comments,
    form: Form,
    mapbox: MapBox,
    msg: Msg,
    login: Login,
    redirect: Redirect,
    entity_text: EntityText,
    entity_poll: EntityPoll,
    entity_author: EntityAuthor,
    entity_actions: EntityActions,
    entity_attachments: EntityAttachments,
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
    api_performance: ApiPerformance
};