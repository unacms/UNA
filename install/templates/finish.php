<div class="bx-install-finish">

    <h1 class="bx-def-font-h1"><?php echo _t('_sys_inst_finish'); ?></h1>

    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_msg_finish'); ?></p>

    <ol>
        <li>
            <label for="bx-install-cron"><?php echo _t('_sys_inst_msg_finish_cron_jobs'); ?></label>
            <textarea id="bx-install-cron" readonly class="bx-form-input-textarea bx-def-font-inputs bx-def-margin-sec-top" spellcheck="false">
MAILTO=<?php echo getParam('site_email') . "\n"; ?>
* * * * * <?=$sPathToPhp; ?> -q <?=BX_DIRECTORY_PATH_ROOT; ?>periodic/cron.php
            </textarea>
        </li>
        <li class="bx-def-margin-top">
            <?php echo _t('_sys_inst_msg_finish_delete_install_folder'); ?>
        </li>
    </ol>

    <div class="bx-install-actions bx-install-actions-end">
        <a href="<?php echo bx_html_attribute(BX_DOL_URL_ROOT); ?>" class="bx-btn"><?php echo _t('_sys_inst_open_site'); ?></a>
        <a href="<?php echo bx_html_attribute(BX_DOL_URL_ROOT); ?>studio/" class="bx-btn bx-btn-primary"><?php echo _t('_sys_inst_open_studio'); ?></a>
    </div>

</div>
