<?php

/**
 * Shared helpers for Persons-backed profile-module unit tests.
 */
abstract class BxPersonsTestCase extends BxDolTestCase
{
    protected $_oModule;
    protected $_aModuleInstancesBackup;
    protected $_iProfileIdBackup;
    protected $_iAccountIdBackup;

    protected function setUp(): void
    {
        $this->_oModule = $this->bxRequirePersons();
        $this->_oModule->_oDb;
        $this->_aModuleInstancesBackup = $this->bxModuleInstances($this->_oModule);

        foreach (['SearchResult', 'FormEntry', 'FormsEntryHelper'] as $sClass)
            bx_import($sClass, $this->_oModule->_aModule);

        $this->_iProfileIdBackup = $this->bxGetProtected($this->_oModule, '_iProfileId', BxBaseModGeneralModule::class);
        $this->_iAccountIdBackup = $this->bxGetProtected($this->_oModule, '_iAccountId', BxBaseModProfileModule::class);
    }

    protected function bxTemplate()
    {
        $oTemplate = $this->_oModule->_oTemplate;
        if ($oTemplate instanceof BxDolModuleProxy)
            $oTemplate = $this->bxGetProtected($oTemplate, '_oProxifiedObject', BxDolModuleProxy::class);

        return $oTemplate;
    }

    protected function tearDown(): void
    {
        if ($this->_oModule && $this->_aModuleInstancesBackup !== null)
            $this->bxModuleInstances($this->_oModule, $this->_aModuleInstancesBackup);

        if ($this->_oModule && $this->_iProfileIdBackup !== null)
            $this->bxSetProtected($this->_oModule, '_iProfileId', $this->_iProfileIdBackup, BxBaseModGeneralModule::class);

        if ($this->_oModule && $this->_iAccountIdBackup !== null)
            $this->bxSetProtected($this->_oModule, '_iAccountId', $this->_iAccountIdBackup, BxBaseModProfileModule::class);
    }

    protected function bxReplaceDb($oDb): void
    {
        $a = $this->_aModuleInstancesBackup;
        $a['_oDb'] = $oDb;
        $this->bxModuleInstances($this->_oModule, $a);
    }

    protected function bxSamplePerson(array $aOverride = []): array
    {
        return array_merge([
            'id' => 15,
            'author' => 10,
            'account_id' => 10,
            'profile_id' => 20,
            'added' => 1700000000,
            'changed' => 1700000100,
            'fullname' => 'Ada',
            'last_name' => 'Lovelace',
            'description' => 'Bio',
            'picture' => 0,
            'cover' => 0,
            'cover_data' => '',
            'badge' => 0,
            'badge_link' => '',
            'allow_view_to' => 3,
            'allow_post_to' => 5,
            'allow_contact_to' => 3,
            'status' => 'active',
            'profile_status' => 'active',
            'featured' => 0,
            'views' => 0,
            'votes' => 0,
            'rvotes' => 0,
            'score' => 0,
            'reports' => 0,
            'comments' => 0,
            'labels' => '',
            'location' => '',
            'birthday' => '1815-12-10',
            'settings' => '',
        ], $aOverride);
    }
}
