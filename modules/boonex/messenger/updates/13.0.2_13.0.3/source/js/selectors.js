;window.oMessengerSelectors = (function($){
    class oMessengerConstants {
        constructor() {
            this.SYSTEM = {
                blockHeader: '.bx-db-header',
                blockContainer: '.bx-db-container',
                blockMenu: '.bx-db-menu',
                msgContainer: '.bx-msg-box-container',
                bxMain: '.bx-main',
                bxTitle: '.bx-db-title',
                menuAddonCounter : '.bx-menu-addon-cnt'
            };

            this.MAIN_PAGE = {
                messengerMainBlock: '.bx-messenger-main-columns-block',
                messengerColumns: '.bx-messenger-columns'
            };

            this.HISTORY = {
                conversationBody: '.bx-messenger-conversations',
                talkBlock: '.bx-messenger-conversation-block',
                talkBlockWrapper: '.bx-messenger-conversation-block-wrapper',
                historyColumn: '#bx-messenger-history-block',
                createTalkArea: '#bx-messenger-users-creation-area',
                tableWrapper: '.bx-messenger-table-wrapper',
                searchItems: '#search-items',
                mainTalkBlock : '.bx-messenger-main-block',
                conversationBlockHistory: '.bx-messenger-conversation-block-history',
                backButton: '.bx-messenger-history-block-header-menu-back',
                messengerHistoryBlock: '.bx-messenger-block',
                uploaderAreaPlaceholderPrefix: 'bx-messenger-uploading-placeholder',
                mainScrollArea: '.bx-messenger-area-scroll',
                searchScrollArea: '.bx-messenger-area-scroll-search',
                scrollAreaItem: '.bx-messenger-area-scroll-item',
                unreadJotsCounter: '#unread-jots-counter'
            };

            this.TALK_BLOCK = {
                messengerBlock: '.bx-messenger-block-messenger',
                historyPanel: '.bx-messenger-block-history-panel',
                groupsPanel: '#bx-messenger-groups-panel',
                infoPanel: '#bx-messenger-block-info-panel',
            };

            this.TALKS_LIST = {
                listColumn: '#bx-messenger-list-block',
                talksList: '.bx-messenger-items-list',
                topItem: '.bx-messenger-always-top',
                talkItem: '.bx-messenger-jots-snip',
                talkItemInfo: '.bx-messenger-jots-snip-info',
                talkItemBubble: '.bx-messenger-jots-snip-info-bubble',
                talksListItems: '{talksList} .bx-messenger-jots-snip',
                panel: 'panel',
                active: 'active',
                unreadLot: 'unread-lot',
                talkStatus:'.bx-messenger-status',
                searchCriteria: '#bx-messenger-filter-talks',
                searchInput: '#bx-messenger-search-block',
                searchCloseIcon: '.bx-messenger-talks-list-header-search-area-icon',
                inboxAreaTitle: '#bx-messenger-inbox-area-title',
                menuButton: '.bx-messenger-talks-list-header-menu',
                createTalkButton: '#bx-messenger-create-post-button',
            };

            this.MENU_AREA = {
                menuColumn: '#bx-messenger-menu-block',
                collapsableArea: '.bx-messenger-nav-menu-collapse',
                chevronUpIcon: '.chevron-up',
                chevronDownIcon: '.chevron-down',
                addonWrapper: '.bx-messenger-nav-menu-addon',
            };

            this.INFO = {
                infoColumn: '#bx-messenger-info-section-block',
                infoColumnC: '.bx-messenger-info-section-block',
                infoColumnContent: '#bx-messenger-info-section-block-content',
            };

            this.DATE_SEPARATOR = {
                dateIntervalsSelector:'.bx-messenger-date-time'
            };

            this.EMOJI = {
                emojiComponent:'una-emoji-picker',
                sendEmojiButton: 'button.smiles',
                reactionButton: 'a.reactions',
                emojiPopup: 'bx-messenger-jot-emoji bx-popup bx-popup-color-bg bx-popup-border',
            };

            this.TEXT_AREA = {
                textArea: '.bx-messenger-post-box',
                inputArea: '#bx-messenger-message-box',
                sendArea: '.bx-messenger-text-box',
                sendButton: '.bx-messenger-post-box-send-button > a,.bx-messenger-post-box-send-button > button',
                replyArea: '.bx-messenger-reply-area',
                replyAreaMessage: '.bx-messenger-reply-area-message',
                sendAreaActionsButtons: '.bx-messenger-post-box-send-actions',
                textAreaDisabled: 'bx-messenger-post-box-disabled',
                talkTitle: '#bx-messenger-talk-title',
                attachmentArea: '.bx-messenger-send-area-attachments',
                attachmentGroup: '.bx-messenger-attachment-group'
            };

            this.HISTORY_INFO = {
                infoArea: '#bx-messenger-info-area',
                typingInfoArea: '.bx-messenger-conversations-typing span',
                connectingArea: '.bx-messenger-info-area-connecting',
                connectionFailedArea: '.bx-messenger-info-area-connect-failed',
                serverErrorArea: '.bx-messenger-no-server',
            };

            this.THREAD = {
                threadReplies: '#bx-messenger-thread-replies'
            };

            this.JOT = {
                jotContainer: '.bx-messenger-jots-message-container',
                moreIcon: '.bx-messenger-jot-menu-more',
                jotWrapper: '.bx-messenger-jots-message-wrapper',
                jotMenu: '.bx-messenger-jot-menu',
                jotLineMenu: '.bx-messenger-jot-menu-line',
                menuSelector: 'div[id^="jot-menu-"]',
                lotsBlock: '.bx-messenger-block-lots',
                jotMain: '.bx-messenger-jots',
                jotTitle: '.bx-messenger-jots-title',
                talkListJotSelector: `${this.HISTORY.conversationBody} .bx-messenger-jots`,
                jotMessage: '.bx-messenger-jots-message',
                jotAvatar: '.bx-messenger-jots-avatars',
                jotAreaInfo: '.bx-messenger-jots-info',
                jotMessageBody: '.bx-messenger-jots-message-body',
                jotDeleted:'.bx-messenger-jots-message-deleted',
                jotHidden:'.bx-messenger-hidden-jot',
                jotMessageView: '.view',
                selectedJot: '.bx-messenger-blink-jot',
                jotIconsArea: '.bx-messenger-message-icons',
                jotIconsEditIcon: '.bx-messenger-jots-message-edit-time',
            };

            this.ATTACHMENTS = {
                mediaAccordion: '.bx-messenger-attachment-accordion',
                switcher: '.bx-messenger-attachment-accordion-switcher',
                attPrefixSelector: 'bx-messenger-attachment-file-',
                attachmentWrappers: '.bx-messenger-media-wrapper',
                attachmentArea: '.bx-messenger-attachment-area',
                attachmentFileWrapper: '.bx-messenger-attachment-file-wrapper'
            };

            this.CREATE_TALK = {
                searchUsersInput: '#bx-messenger-add-users-input',
                existedUsersArea: '.bx-messenger-existed-users-list',
                selectedUsersArea: '#bx-messenger-add-users',
                foundUsersArea: '#bx-messenger-profiles-list',
                filterCriteria: '.bx-create-convo-criteria',
                selectedUsersListInputs: '{selectedUsersArea} input[name="users[]"]',
                filterCriteriaForm: '#bx-messenger-convo-filter-criteria',
                createConvoForm: '#bx_messenger_lots',
                selectedUserElement: '.bx-messenger-participants-added-item'
            }
        };
        get(sName){
            return typeof this[sName] !== 'undefined' ? this[sName] : null;
        }
    }

    const oConstants = new oMessengerConstants();
    const oLib = Object.create(null);
    for (let sKey in oConstants) {
        if (Object.prototype.hasOwnProperty.call(oConstants, sKey)) {
            const oArea = oConstants[sKey];
            Object.keys(oConstants[sKey]).some((sValue) => {
                oConstants[sKey][sValue] = oConstants[sKey][sValue].replace(/\{(.*?)\}/ig, (s) => oArea[s.replace(/[\{|\}]/ig, '')]);
            });
            oLib[sKey] = oConstants[sKey];
        }
    };

    return oLib;
})(jQuery);