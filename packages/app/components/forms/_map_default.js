import FormComments from './comments';
import FormFeed from './feed';
import FormPost from './post';
import FormConfirmEmail from './confirm_email';
import Messenger from './messenger';

export const componentsMapDefault = {
    sys_confirm_email: FormConfirmEmail,
    comment: FormComments,
    feed: FormFeed,
    feed_edit: FormFeed,
    bx_posts: FormPost,
    bx_forum: FormPost,
    bx_messenger: Messenger
};