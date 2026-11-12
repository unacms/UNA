/** Conversations live in features/messages; this keeps the older import path. */
import { profileSummaryKey } from '../features/profile/graph';

/** The query key of the profile a new conversation goes to; messageTo seeds it. */
export { profileSummaryKey };
export { Conversation, CONVERSATION_REPLY_FIELD, NewConversation } from '../features/messages/conversation';
