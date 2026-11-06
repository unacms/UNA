<div class="bx-install-finish">

    <h1 class="bx-def-font-h1"><?php echo _t('_sys_inst_finish'); ?></h1>

    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_msg_finish'); ?></p>

    <ol>
        <li>
            <?php echo _t('_sys_inst_msg_finish_cron_jobs'); ?>
            <textarea class="bx-form-input-textarea bx-def-font-inputs bx-def-margin-sec-top">
MAILTO=<?php echo getParam('site_email') . "\n"; ?>
* * * * * <?=$sPathToPhp; ?> -q <?=BX_DIRECTORY_PATH_ROOT; ?>periodic/cron.php
            </textarea>
        </li>
        <li class="bx-def-margin-top">
            <?php echo _t('_sys_inst_msg_finish_delete_install_folder'); ?>
        </li>
        <li class="bx-def-margin-top">
            <?php echo _t('_sys_inst_msg_finish_goto_studio', BX_DOL_URL_ROOT); ?>
        </li>
    </ol>

</div>
