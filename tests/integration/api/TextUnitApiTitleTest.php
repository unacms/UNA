<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Units of text modules in the API have a title. Polls have no title field, so theirs is made
 * from the question, as on the site, and reading the title must not raise a warning: with
 * display_errors on, the warning comes before the JSON and the app can't read the response.
 *
 * The test makes its own poll and post and deletes them afterwards.
 */
#[Group('integration')]
class TextUnitApiTitleTest extends BxDolIntegrationTestCase
{
    protected $_aRows = [];
    protected $_aClassesBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aClassesBackup = $GLOBALS['bxDolClasses'] ?? [];
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aRows as [$sTable, $iId])
            $oDb->query("DELETE FROM `$sTable` WHERE `id` = :id", ['id' => $iId]);
        $this->_aRows = [];

        // Making a unit sets the test entry on shared objects (its menus, the page): put them back.
        foreach (array_keys($GLOBALS['bxDolClasses'] ?? []) as $sKey)
            if (!array_key_exists($sKey, $this->_aClassesBackup))
                unset($GLOBALS['bxDolClasses'][$sKey]);
        foreach ($this->_aClassesBackup as $sKey => $o)
            $GLOBALS['bxDolClasses'][$sKey] = $o;
        BxDolDb::getInstance()->cleanMemoryAll();

        parent::tearDown();
    }

    protected function entry(string $sModule, string $sTable, array $aFields): array
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped($sModule . ' is not installed.');

        $this->bxLoginAsAdmin();
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();

        $oDb = BxDolDb::getInstance();
        $aSet = [];
        $aBind = ['author' => $iAuthor, 'now' => time()];
        foreach ($aFields as $sField => $sValue) {
            $aSet[] = "`$sField` = :$sField";
            $aBind[$sField] = $sValue;
        }
        $oDb->query("INSERT INTO `$sTable` SET `author` = :author, `added` = :now, `changed` = :now, `allow_view_to` = '3', " . implode(', ', $aSet), $aBind);
        $iId = (int)$oDb->lastId();
        $this->_aRows[] = [$sTable, $iId];

        return BxDolModule::getInstance($sModule)->_oDb->getContentInfoById($iId);
    }

    /**
     * The unit the API sends for an entry, failing on any PHP warning or notice on the way.
     */
    protected function unit(string $sModule, array $aData): array
    {
        $aWarnings = [];
        set_error_handler(function ($iNo, $sMessage, $sFile, $iLine) use (&$aWarnings) {
            $aWarnings[] = "$sMessage in $sFile:$iLine";
            return true;
        }, E_WARNING | E_NOTICE | E_USER_WARNING | E_USER_NOTICE);
        try {
            $aUnit = BxDolModule::getInstance($sModule)->decodeDataAPI($aData);
        }
        finally {
            restore_error_handler();
        }

        $this->assertSame([], $aWarnings, 'No warnings while the unit is made.');
        return $aUnit;
    }

    public function testPollTitleIsItsQuestion(): void
    {
        $aData = $this->entry('bx_polls', 'bx_polls_entries', ['text' => '<p>Tabs or spaces?</p>', 'status' => 'active', 'status_admin' => 'active']);

        $this->assertSame('Tabs or spaces?', $this->unit('bx_polls', $aData)['title']);
    }

    public function testPostTitleIsUnchanged(): void
    {
        $aData = $this->entry('bx_posts', 'bx_posts_posts', ['title' => 'Tea & biscuits', 'text' => '<p>Fixture</p>', 'status' => 'active', 'status_admin' => 'active']);

        $this->assertSame('Tea & biscuits', $this->unit('bx_posts', $aData)['title'], 'The raw title, as before: the app escapes it.');
    }

    public function testClassTitleIsTheStoredTitle(): void
    {
        // The Classes template wraps a title in status HTML for the site; the app gets the stored title.
        $aData = $this->entry('bx_classes', 'bx_classes_classes', ['title' => 'Intro & basics', 'text' => '<p>Fixture</p>', 'status' => 'active', 'status_admin' => 'active']);

        $this->assertSame('Intro & basics', $this->unit('bx_classes', $aData)['title']);
    }
}
