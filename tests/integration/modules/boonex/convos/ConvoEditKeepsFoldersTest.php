<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Editing a conversation updates its participants. Someone who is in it already keeps the
 * folder and the read count they have: a recipient who moved it to Trash used to get a second
 * row in the author's folder, so the conversation came back to their Inbox, unread, while it
 * stayed in their Trash too.
 *
 * The test makes its own person profiles (the author and two recipients: on a fresh install
 * the administrator acts as the account's own profile, which starts no conversations, and
 * there is nobody to write to), its conversation and folder rows, and removes them.
 */
#[Group('integration')]
class ConvoEditKeepsFoldersTest extends BxDolIntegrationTestCase
{
    protected $_iAuthor = 0;
    protected $_iConvo = 0;
    protected $_aPersonIds = [];
    protected $_aProfileIds = [];
    protected $_mProfileIdBackup = null;
    protected $_mForcedProfileBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_convos'))
            $this->markTestSkipped('Conversations are not installed.');
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons are not installed.');

        $this->bxLoginAsAdmin();

        // the administrator acts as a person of the account
        $this->_iAuthor = $this->addPerson('author');
        $this->_mForcedProfileBackup = $GLOBALS['glForceCurrentProfileId'] ?? false;
        $GLOBALS['glForceCurrentProfileId'] = $this->_iAuthor;
        $this->assertSame($this->_iAuthor, (int)bx_get_logged_profile_id());

        // a module keeps the profile it was created for, which an earlier test may have logged in as
        $this->_mProfileIdBackup = BxDolModule::getInstance('bx_convos')->setProfileId($this->_iAuthor);
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_iConvo) {
            $oDb->query("DELETE FROM `bx_convos_conv2folder` WHERE `conv_id` = :id", ['id' => $this->_iConvo]);
            $oDb->query("DELETE FROM `bx_convos_conversations` WHERE `id` = :id", ['id' => $this->_iConvo]);
        }
        if ($this->_aProfileIds)
            $oDb->query("DELETE FROM `sys_profiles` WHERE `id` IN (" . implode(',', array_map('intval', $this->_aProfileIds)) . ")");
        if ($this->_aPersonIds)
            $oDb->query("DELETE FROM `bx_persons_data` WHERE `id` IN (" . implode(',', array_map('intval', $this->_aPersonIds)) . ")");
        $oDb->cleanMemoryAll();
        if ($this->_mProfileIdBackup !== null)
            BxDolModule::getInstance('bx_convos')->setProfileId($this->_mProfileIdBackup);
        if ($this->_mForcedProfileBackup !== null) {
            if ($this->_mForcedProfileBackup === false)
                unset($GLOBALS['glForceCurrentProfileId']);
            else
                $GLOBALS['glForceCurrentProfileId'] = $this->_mForcedProfileBackup;
        }

        BxDolForm::unSetObjectInstance('bx_convos', 'bx_convos_entry_edit');

        parent::tearDown();
    }

    public function testAnEditLeavesARecipientsFolderAndReadCountAsTheyAre(): void
    {
        $oDb = BxDolDb::getInstance();

        $iInTrash = $this->addPerson('in Trash');
        $iNew = $this->addPerson('new');
        $oModule = BxDolModule::getInstance('bx_convos');
        foreach ([$iInTrash, $iNew] as $iProfile)
            $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $oModule->checkAllowedContact($iProfile), 'the author may write to the test\'s own persons');

        $iNow = time();
        $oDb->query("INSERT INTO `bx_convos_conversations` SET `author` = :a, `added` = :now, `changed` = :now, `text` = 'ConvoEditKeepsFoldersTest', `last_reply_timestamp` = :now, `last_reply_profile_id` = :a, `last_reply_comment_id` = 0", ['a' => $this->_iAuthor, 'now' => $iNow]);
        $this->_iConvo = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $this->_iConvo);

        // the author has it in the Inbox; the recipient read three replies and moved it to Trash
        $this->folderRow(BX_CNV_FOLDER_INBOX, $this->_iAuthor, 0);
        $this->folderRow(BX_CNV_FOLDER_TRASH, $iInTrash, 3);

        // the edit form with its recipients, as an edit by the author submits them
        $oForm = BxDolForm::getObjectInstance('bx_convos', 'bx_convos_entry_edit');
        $this->assertNotFalse($oForm);
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $oForm->initChecker([], ['recipients' => [$iInTrash, $iNew]]);
        $oForm->updateParticipants($this->_iConvo, BX_CNV_FOLDER_INBOX, false);

        $this->assertSame([[BX_CNV_FOLDER_TRASH, 3]], $this->foldersOf($iInTrash), 'still in Trash only, as read as it was');
        $this->assertSame([[BX_CNV_FOLDER_INBOX, 0]], $this->foldersOf($this->_iAuthor), 'the author\'s own row is as it was');
        // someone added by the edit gets it in the Inbox, unread
        $this->assertSame([[BX_CNV_FOLDER_INBOX, -1]], $this->foldersOf($iNew));
    }

    /**
     * An active person profile of the administrator's account, anyone may write to: its profile id.
     */
    protected function addPerson(string $sName): int
    {
        $oDb = BxDolDb::getInstance();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_persons_data` SET `author` = 0, `added` = :now, `changed` = :now, `picture` = 0, `cover` = 0, `cover_data` = '', `fullname` = :name, `last_name` = '', `description` = '', `labels` = '', `location` = '', `settings` = ''", [
            'now' => $iNow, 'name' => 'ConvoEditKeepsFoldersTest ' . $sName,
        ]);
        $iPerson = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iPerson);
        $this->_aPersonIds[] = $iPerson;

        $oDb->query("INSERT INTO `sys_profiles` SET `account_id` = :account, `type` = 'bx_persons', `content_id` = :person, `status` = 'active'", [
            'account' => (int)$this->bxAccount('admin')->id(), 'person' => $iPerson,
        ]);
        $iProfile = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iProfile);
        $this->_aProfileIds[] = $iProfile;

        $oDb->query("UPDATE `bx_persons_data` SET `author` = :profile WHERE `id` = :person", ['profile' => $iProfile, 'person' => $iPerson]);
        $oDb->cleanMemoryAll();

        return $iProfile;
    }

    protected function folderRow(int $iFolder, int $iProfile, int $iRead): void
    {
        BxDolDb::getInstance()->query("INSERT INTO `bx_convos_conv2folder` SET `conv_id` = :c, `folder_id` = :f, `collaborator` = :p, `read_comments` = :r", [
            'c' => $this->_iConvo, 'f' => $iFolder, 'p' => $iProfile, 'r' => $iRead,
        ]);
    }

    /** The profile's rows of the conversation: [[folder, read count], ...]. */
    protected function foldersOf(int $iProfile): array
    {
        $aRows = BxDolDb::getInstance()->getAll("SELECT `folder_id`, `read_comments` FROM `bx_convos_conv2folder` WHERE `conv_id` = :c AND `collaborator` = :p ORDER BY `folder_id`", ['c' => $this->_iConvo, 'p' => $iProfile]);
        return array_map(function ($a) {
            return [(int)$a['folder_id'], (int)$a['read_comments']];
        }, $aRows);
    }
}
