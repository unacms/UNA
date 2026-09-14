<?php

/**
 * Shared helpers for Posts-backed content-module unit tests.
 */
abstract class BxPostsTestCase extends BxDolTestCase
{
    protected $_oModule;
    protected $_aModuleInstancesBackup;
    protected $_iProfileIdBackup;

    protected function setUp(): void
    {
        $this->_oModule = $this->bxRequirePosts();
        $this->_oModule->_oDb;
        $this->_aModuleInstancesBackup = $this->bxModuleInstances($this->_oModule);

        foreach (['SearchResult', 'FormEntry', 'FormsEntryHelper'] as $sClass)
            bx_import($sClass, $this->_oModule->_aModule);

        $oProfileId = new ReflectionProperty(BxBaseModGeneralModule::class, '_iProfileId');
        $oProfileId->setAccessible(true);
        $this->_iProfileIdBackup = $oProfileId->getValue($this->_oModule);
    }

    protected function bxTemplate()
    {
        $oTemplate = $this->_oModule->_oTemplate;
        if ($oTemplate instanceof BxDolModuleProxy) {
            $oProperty = new ReflectionProperty(BxDolModuleProxy::class, '_oProxifiedObject');
            $oProperty->setAccessible(true);
            $oTemplate = $oProperty->getValue($oTemplate);
        }

        return $oTemplate;
    }

    protected function tearDown(): void
    {
        if ($this->_oModule && $this->_aModuleInstancesBackup !== null)
            $this->bxModuleInstances($this->_oModule, $this->_aModuleInstancesBackup);

        if ($this->_oModule && $this->_iProfileIdBackup !== null)
            $this->bxSetProtected($this->_oModule, '_iProfileId', $this->_iProfileIdBackup, BxBaseModGeneralModule::class);
    }

    protected function bxReplaceDb($oDb): void
    {
        $a = $this->_aModuleInstancesBackup;
        $a['_oDb'] = $oDb;
        $this->bxModuleInstances($this->_oModule, $a);
    }

    protected function bxSamplePost(array $aOverride = []): array
    {
        return array_merge([
            'id' => 15,
            'author' => 10,
            'added' => 1700000000,
            'changed' => 1700000100,
            'published' => 1700000000,
            'title' => 'Sample post',
            'abstract' => 'Abstract',
            'text' => 'Body text',
            'allow_view_to' => 3,
            'cf' => 1,
            'status' => 'active',
            'status_admin' => 'active',
            'allow_comments' => 1,
            'thumb' => 0,
            'thumb_data' => '',
            'views' => 0,
            'votes' => 0,
            'rvotes' => 0,
            'score' => 0,
            'reports' => 0,
            'comments' => 0,
            'featured' => 0,
            'labels' => '',
            'location' => '',
        ], $aOverride);
    }
}
