

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
        /**
         * Forms (by display name) that show each caption as the field's placeholder, with no label.
         * Empty by default: labels follow UNA's label style (see `adaptive_labels`).
         */
        without_captions: [],
        /**
         * Floating labels: the caption rests inside the field like a placeholder, then moves to
         * its top once the field is focused or has a value. `null` follows UNA (Studio > Designer >
         * Settings, or a form display's own style; regular labels unless UNA says adaptive).
         * `false` never floats labels, `true` floats them in every form.
         */
        adaptive_labels: null,
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
            border_shape: 'circle',
            // Right inset per input size. The 36px button is centred, so in a
            // 52px large input it is 8px from the top and bottom; right-2 matches.
            position: {
                small: 'right-1.5',
                regular: 'right-1.5',
                large: 'right-2',
            },
        },

        sys_login: {
            hide_errors: true,
            button_full_width: true,
            // "Forgot password?" by the Password field: on its label's line, or under the field
            // when the label floats. Empty: the link is centred under the form instead.
            forgot_password_link: '/forgot-password',
        },

        sys_forgot_password: {
            hide_errors: true,
            button_full_width: true,
            hide_on_msg: true,
        },

        // Invite by email (bx_invites/get_block_form_invite, named after the module): after sending, only the message.
        bx_invites: {
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