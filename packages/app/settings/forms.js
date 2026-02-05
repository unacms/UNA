

export const settingsForms = {
    forms: {
        single_editor: true,
        optional_text: '', // OLD appSetting('layout', 'form_fields_optional_text')
        mandatory_icon: 'Asterisk', // OLD appSetting('layout', 'form_fields_mandatory_icon')
        auto_ghosts_in_files: true,
        form_container: 'w-full p-2 gap-4 max-w-2xl mx-auto ',
        field_padding: ' gap-1 ',
        caption_classes:
            'font-semibold text-sm text-card-foreground',
        without_captions: [
            // OLD appSetting('forms', 'form_without_captions')
            'sys_login',
            'sys_account_create',
            'sys_forgot_password',
            'bx_invites_request_send',
        ],
        visibility_control_names: [
            // appSetting('layout', 'form_' + name + '_control_names')
            '*_allow_view_to',
            '*_object_privacy_view',
        ],
        selector_control_names: ['*_cat', '*_space_cat'],

        password_eye_button: {
            size: 'sm',
            variant: 'text',
            startDecorator: {
                visible: 'Eye',
                hidden: 'EyeClosed',
            },
            rounded: false,
        },

        sys_login: { hide_errors: true, button_full_width: true },

        sys_forgot_password: {
            hide_errors: true,
            button_full_width: true,
            
        },

        /* bx_invites_request_send: {
            hide_errors: true,
            button_full_width: true,

        },
        sys_account_create: {
            hide_errors: true,
            button_full_width: true,

        },*/
    }
}