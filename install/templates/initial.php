<div class="bx-install-initial">

    <h1 class="bx-def-font-h1"><?php echo _t('_sys_inst_welcome'); ?></h1>
    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_welcome_lead'); ?></p>

    <ol class="bx-install-steps">
        <li><?php echo _t('_sys_inst_welcome_step_permissions'); ?></li>
        <li><?php echo _t('_sys_inst_welcome_step_config'); ?></li>
        <li><?php echo _t('_sys_inst_welcome_step_modules'); ?></li>
    </ol>

    <?php if ($aWarnings): ?>
    <div class="bx-install-initial-waring bx-def-margin-top" role="status">
        <?php echo _t('_sys_inst_hosting_warnings'); ?>
    </div>
    <?php endif; ?>

    <div class="bx-install-actions">
        <a href="?action=permissions" class="bx-btn bx-btn-primary"><?php echo _t('_sys_inst_start_installation'); ?></a>
        <a href="?action=audit" class="bx-btn"><?php echo _t('_sys_inst_server_audit'); ?></a>
    </div>

</div>
