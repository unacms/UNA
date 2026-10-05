

export const settingsForms = {
    forms: {
        single_editor: true,
        optional_text: '', // OLD appSetting('layout', 'form_fields_optional_text')
        mandatory_icon: 'Asterisk', // OLD appSetting('layout', 'form_fields_mandatory_icon')
        auto_ghosts_in_files: true,
        form_container: '@container/form-container w-full gap-4 mx-auto ',
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
        /**
         * When true, forms in `without_captions` use floating “eyebrow” labels:
         * caption rests inside the field like a placeholder, then moves onto the
         * top edge when the field is focused or has a value.
         */
        adaptive_labels: true,
        visibility_control_names: [
            // appSetting('layout', 'form_' + name + '_control_names')
            '*_allow_view_to',
            '*_object_privacy_view',
        ],
        selector_control_names: ['*_cat', '*_space_cat'],
        /** Form display names excluded from the web modal "unsaved changes" close guard. */
        skip_unsaved_close_guard: [
            'comment',
            'feed',
            'feed_edit',
            'bx_messenger',
            'bx_timeline_post_add_profile',
        ],

        password_eye_button: {
            image: {
                visible: 'Eye',
                hidden: 'EyeClosed',
            },
        },

        sys_login: { hide_errors: true, button_full_width: true },

        sys_forgot_password: {
            hide_errors: true,
            button_full_width: true,
            hide_on_msg: true,
        },

        bx_invites_request_send: {
            hide_errors: true,
            button_full_width: true,
        },

        sys_account_create: {
            hide_errors: true,
            button_full_width: true,
        },
         /**
         * Client-side image prepare before UNA upload.
         * `skip_resize[module]` uploads the original. `by_module[module]`
         * overrides max box (image is scaled to fit, not cropped).
         */
        image_upload: {
            max_width: 2000,
            max_height: 2000,
            webp_over_mb: 4,
            skip_resize: {},
            by_module: {},
        },
    }
}