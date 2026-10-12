<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Reactions settings: mode (solo / few / many), default reaction, reactions per person
 * and free-picked emoji, which are stored as e_<hex> codes.
 */
#[Group('integration')]
class ReactionsModesTest extends BxDolIntegrationTestCase
{
    private const SYSTEM = 'bx_timeline_reactions';
    private const OPTIONS = ['sys_vote_reactions_mode', 'sys_vote_reactions_default', 'sys_vote_reactions_per_user', 'sys_vote_reactions_split_counters'];

    private array $_aOptionsBackup = [];
    private int $_iEventId = 0;
    /** The test member's reactions to the event before the test, given back in tearDown. */
    private array $_aReactionsBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach (self::OPTIONS as $sName)
            $this->_aOptionsBackup[$sName] = getParam($sName);
    }

    protected function tearDown(): void
    {
        unset($_GET['value'], $_GET['reaction']);

        if ($this->_iEventId && ($oVote = $this->reactions($this->_iEventId))) {
            $iAuthorId = bx_get_logged_profile_id();
            foreach ($oVote->getReactionsBy($this->_iEventId, $iAuthorId) as $sReaction)
                $oVote->vote(['reaction' => $sReaction]);

            //--- Give back what the member had before the test, in a mode that takes any of it.
            $this->configure('many', 'like', 5);
            $oVote = $this->reactions($this->_iEventId);
            foreach ($this->_aReactionsBackup as $sReaction)
                $oVote->vote(['reaction' => $sReaction]);
        }

        foreach ($this->_aOptionsBackup as $sName => $sValue)
            setParam($sName, $sValue);

        parent::tearDown();
    }

    private function configure(string $sMode, string $sDefault = 'like', int $iPerUser = 1): void
    {
        setParam('sys_vote_reactions_mode', $sMode);
        setParam('sys_vote_reactions_default', $sDefault);
        setParam('sys_vote_reactions_per_user', (string)$iPerUser);
    }

    /**
     * A fresh instance: settings are read in the constructor and instances are cached.
     */
    private function reactions(int $iObjectId = 1): ?BxDolVoteReactions
    {
        if (!BxDolVote::getObjectInstance(self::SYSTEM, $iObjectId, false))
            return null;

        unset($GLOBALS['bxDolClasses']['BxDolVote!' . self::SYSTEM . $iObjectId]);
        $oVote = BxDolVote::getObjectInstance(self::SYSTEM, $iObjectId);

        return $oVote instanceof BxDolVoteReactions ? $oVote : null;
    }

    private function reactionsOrSkip(int $iObjectId = 1): BxDolVoteReactions
    {
        $oVote = $this->reactions($iObjectId);
        if (!$oVote)
            $this->markTestSkipped(self::SYSTEM . ' is not installed.');

        return $oVote;
    }

    public function testSettingsHaveTheirOwnSection(): void
    {
        $oDb = BxDolDb::getInstance();
        $aCategory = $oDb->getRow("SELECT `id`, `caption`, `hidden` FROM `sys_options_categories` WHERE `name` = 'reactions'");
        $this->assertNotEmpty($aCategory, 'Studio > Settings > Global has a Reactions section');
        $this->assertSame(0, (int)$aCategory['hidden']);
        $this->assertNotSame($aCategory['caption'], _t($aCategory['caption']), 'the section has a title');

        $aOptions = $oDb->getPairs("SELECT `name`, `category_id` FROM `sys_options` WHERE `name` IN ('" . implode("', '", self::OPTIONS) . "')", 'name', 'category_id');
        $this->assertSame(self::OPTIONS, array_keys(array_intersect_key(array_flip(self::OPTIONS), $aOptions)), 'all reaction options exist');
        foreach ($aOptions as $sName => $iCategoryId)
            $this->assertSame((int)$aCategory['id'], (int)$iCategoryId, $sName . ' is in the Reactions section');
    }

    public function testEmojiValidation(): void
    {
        foreach (['😀', '❤️', '👍🏽', '🏳️‍🌈', '1️⃣', '🇺🇦'] as $sEmoji)
            $this->assertTrue(BxDolVoteReactions::isEmoji($sEmoji), $sEmoji . ' is an emoji.');

        foreach (['', 'a', 'like', '😀😀', '<b>', '😀 '] as $sText)
            $this->assertFalse(BxDolVoteReactions::isEmoji($sText), '"' . $sText . '" is not one emoji.');
    }

    public function testEmojiCodeRoundTrip(): void
    {
        $this->assertSame('e_1f600', BxDolVoteReactions::encodeEmoji('😀'));
        $this->assertSame('e_2764_fe0f', BxDolVoteReactions::encodeEmoji('❤️'));
        $this->assertSame('❤️', BxDolVoteReactions::decodeEmoji('e_2764_fe0f'));

        foreach (['e_', 'e_zz', 'e_61', 'like', 'e_d800', 'e_110000'] as $sCode)
            $this->assertFalse(BxDolVoteReactions::decodeEmoji($sCode), $sCode . ' is not an emoji code.');
    }

    public function testFewModeTakesOnlyListedReactions(): void
    {
        $this->configure('few');
        $oVote = $this->reactionsOrSkip();

        $this->assertSame('like', $oVote->normalizeReaction('like'));
        $this->assertFalse($oVote->normalizeReaction('😀'));
        $this->assertFalse($oVote->normalizeReaction('e_1f600'));
        $this->assertFalse($oVote->normalizeReaction('nope'));
    }

    public function testManyModeTakesAnyEmoji(): void
    {
        $this->configure('many');
        $oVote = $this->reactionsOrSkip();

        $this->assertSame('e_1f600', $oVote->normalizeReaction('😀'));
        $this->assertSame('e_1f600', $oVote->normalizeReaction('e_1f600'));
        $this->assertSame('like', $oVote->normalizeReaction('👍'), 'An emoji on the list is that reaction.');
        $this->assertFalse($oVote->normalizeReaction('text'));
        $this->assertFalse($oVote->normalizeReaction('👨‍👩‍👧‍👦'), 'Codes longer than the column are refused.');

        $aReaction = $oVote->getReaction('e_1f600');
        $this->assertIsArray($aReaction);
        $this->assertSame('😀', $aReaction['emoji']);
    }

    public function testSoloModeKeepsOnlyTheDefault(): void
    {
        $this->configure('solo', 'love');
        $oVote = $this->reactionsOrSkip();

        $this->assertSame('solo', $oVote->getMode());
        $this->assertSame('love', $oVote->getDefaultReaction());
        $this->assertSame(1, $oVote->getPerUser());
        $this->assertSame('love', $oVote->normalizeReaction('love'));
        $this->assertFalse($oVote->normalizeReaction('like'));
    }

    public function testUnknownDefaultMeansNone(): void
    {
        $this->configure('few', 'no_such_reaction');
        $this->assertSame('', $this->reactionsOrSkip()->getDefaultReaction());
    }

    /**
     * The test member on the latest timeline event, with their reactions to it set aside (tearDown gives them back),
     * in the given mode.
     */
    private function memberOnEventOrSkip(string $sMode, int $iPerUser): BxDolVoteReactions
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            $this->markTestSkipped('Timeline is not installed.');

        $iEventId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `bx_timeline_events` WHERE `active` = 1 ORDER BY `id` DESC LIMIT 1");
        if (!$iEventId)
            $this->markTestSkipped('There are no timeline events to react to.');

        $this->bxLoginAsUser();
        $this->configure($sMode, 'like', $iPerUser);
        $oVote = $this->reactionsOrSkip($iEventId);
        if (!$oVote->isAllowedVote())
            $this->markTestSkipped('The test user may not react to timeline events: ' . strip_tags((string)$oVote->msgErrAllowedVote()));

        $this->_iEventId = $iEventId;
        $this->_aReactionsBackup = $oVote->getReactionsBy($iEventId, bx_get_logged_profile_id());
        foreach ($this->_aReactionsBackup as $sReaction)
            $oVote->vote(['reaction' => $sReaction]);

        return $oVote;
    }

    /**
     * The reaction a classic web request (`actionVote`) asks for, as `_getVoteData` reads it, or false.
     */
    private function webVoteReaction(BxDolVoteReactions $oVote, string $sReaction)
    {
        $_GET['value'] = '1';
        $_GET['reaction'] = $sReaction;
        $aData = (new ReflectionMethod($oVote, '_getVoteData'))->invoke($oVote);

        return $aData === false ? false : $aData['reaction'];
    }

    public function testWebTakesBackLeftoverReaction(): void
    {
        $oVote = $this->memberOnEventOrSkip('many', 2);
        $this->assertSame(0, (int)$oVote->vote(['reaction' => '😀'])['code']);

        //--- Few mode no longer offers the emoji, but its owner can still send it back to take it back.
        $this->configure('few', 'like', 2);
        $oVote = $this->reactionsOrSkip($this->_iEventId);
        $this->assertSame('e_1f600', $this->webVoteReaction($oVote, 'e_1f600'));
        $this->assertSame('e_1f600', $this->webVoteReaction($oVote, '😀'));
        $this->assertFalse($this->webVoteReaction($oVote, 'e_1f602'), 'An emoji one does not have is refused.');
        $this->assertSame('love', $this->webVoteReaction($oVote, 'love'));

        $aResult = $oVote->vote(['reaction' => $this->webVoteReaction($oVote, 'e_1f600')]);
        $this->assertSame(0, (int)$aResult['code']);
        $this->assertSame([], $aResult['api']['reactions']);
    }

    public function testMemberReactionsWithLimitAndReplace(): void
    {
        //--- Two reactions allowed: both stay, a third is refused, giving one again takes it back.
        $oVote = $this->memberOnEventOrSkip('many', 2);

        $this->assertSame(0, (int)$oVote->vote(['reaction' => 'like'])['code']);
        $aResult = $oVote->vote(['reaction' => '😀']);
        $this->assertSame(0, (int)$aResult['code']);
        $this->assertSame(['like', 'e_1f600'], $aResult['api']['reactions']);
        $this->assertSame(1, (int)$aResult['api']['counter']['count_e_1f600']);

        $aResult = $oVote->vote(['reaction' => 'love']);
        $this->assertSame(BX_DOL_OBJECT_ERR_DUPLICATE, (int)$aResult['code']);

        $aResult = $oVote->vote(['reaction' => 'e_1f600']);
        $this->assertSame(0, (int)$aResult['code']);
        $this->assertSame(['like'], $aResult['api']['reactions']);

        //--- One reaction allowed: a new one replaces the old one.
        $this->configure('few', 'like', 1);
        $oVote = $this->reactionsOrSkip($this->_iEventId);

        $aResult = $oVote->vote(['reaction' => 'love']);
        $this->assertSame(0, (int)$aResult['code']);
        $this->assertSame(['love'], $aResult['api']['reactions']);
        $this->assertSame('love', $aResult['api']['reaction']);

        //--- Few mode refuses a free emoji.
        $this->assertSame(BX_DOL_OBJECT_ERR_WRONG_DATE, (int)$oVote->vote(['reaction' => '😀'])['code']);

        //--- Reactions the settings no longer offer can still be taken back.
        $this->configure('many', 'like', 2);
        $oVote = $this->reactionsOrSkip($this->_iEventId);
        $this->assertSame(['love', 'e_1f600'], $oVote->vote(['reaction' => '😀'])['api']['reactions']);

        $this->configure('solo', 'like');
        $oVote = $this->reactionsOrSkip($this->_iEventId);
        $this->assertSame(BX_DOL_OBJECT_ERR_WRONG_DATE, (int)$oVote->vote(['reaction' => 'e_1f602'])['code'], 'An emoji one does not have is refused.');

        $aResult = $oVote->vote(['reaction' => 'e_1f600']);
        $this->assertSame(0, (int)$aResult['code']);
        $this->assertSame(['love'], $aResult['api']['reactions']);

        $aResult = $oVote->vote(['reaction' => 'love']);
        $this->assertSame(0, (int)$aResult['code'], 'Solo mode with "like" still takes back "love".');
        $this->assertSame([], $aResult['api']['reactions']);
    }
}
