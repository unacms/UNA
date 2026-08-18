<div class="bx-install-initial">

    <img class="bx-def-margin-bottom bx-install-img" src="img/logo.svg" alt="UNA" />

    <div class="bx-install-actions">
        <a href="?action=permissions" class="bx-btn bx-btn-primary"><?php echo _t('_sys_inst_start_installation'); ?></a>
        <a href="?action=audit" class="bx-btn"><?php echo _t('_sys_inst_server_audit'); ?></a>
    </div>

    <?php if ($aWarnings): ?>
    <div class="bx-install-initial-waring bx-def-margin-top">
        <?php echo _t('_sys_inst_hosting_warnings'); ?>
    </div>
    <?php endif; ?>

</div>
