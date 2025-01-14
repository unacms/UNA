import FormComments from './comments';
import FormFeed from './feed';
import FormFeedEdit from './feed_edit';
import FormPost from './post';
import FormConfirmEmail from './confirm_email';
import FormSignUp from './sign_up';
import FormPassword from './forgot_password'
import Invite from './invite';
import Messenger from './messenger';

export const componentsMapDefault = {
    sys_confirm_email: FormConfirmEmail,
   // sys_account_create: FormSignUp,
   // sys_forgot_password: FormPassword,
   // bx_invites_request_send: Invite,
    comment: FormComments,
    feed: FormFeed,
    feed_edit: FormFeed,
    bx_posts: FormPost,
    bx_forum: FormPost,
    bx_messenger: Messenger
};