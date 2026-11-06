<div class="bx-install-initial-fail">

    <?php echo _t('_sys_inst_hosting_fails'); ?>
    <ul>
    <?php foreach ($aErrors as $sMsg): ?>
        <li><?=$sMsg; ?></li>
    <?php endforeach; ?>
    </ul>

    <a href="?action=audit" class="bx-btn"><?php echo _t('_sys_inst_server_audit'); ?></a>

</div>
