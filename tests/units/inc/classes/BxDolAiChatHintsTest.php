<?php

/**
 * Task hints above the agent chat: which module is asked, what reaches the chat.
 */
class BxDolAiChatHintsTest extends \PHPUnit\Framework\TestCase
{
    protected function setUp(): void
    {
        BxDolAiChatHintsTestDouble::$aModules = [];
        BxDolAiChatHintsTestDouble::$aAnswers = [];
        BxDolAiChatHintsTestDouble::$aAsked = [];
    }

    public function testNoAgentAsksNoModule()
    {
        BxDolAiChatHintsTestDouble::$aModules = ['bx_a'];
        BxDolAiChatHintsTestDouble::$aAnswers = ['bx_a' => [['type' => 'reply', 'label' => 'X']]];

        $this->assertSame([], BxDolAiChatHintsTestDouble::get([], 0));
        $this->assertSame([], BxDolAiChatHintsTestDouble::get(['id' => 0], 0));
        $this->assertSame([], BxDolAiChatHintsTestDouble::$aAsked);
    }

    public function testFirstModuleThatOwnsTheAgentWins()
    {
        BxDolAiChatHintsTestDouble::$aModules = ['bx_a', 'bx_b', 'bx_c'];
        BxDolAiChatHintsTestDouble::$aAnswers = [
            'bx_b' => [['type' => 'reply', 'label' => 'From b']],
            'bx_c' => [['type' => 'reply', 'label' => 'From c']],
        ];

        $this->assertSame([['type' => 'reply', 'label' => 'From b']], BxDolAiChatHintsTestDouble::get(['id' => 15], 0));
        $this->assertSame(['bx_a', 'bx_b'], array_column(BxDolAiChatHintsTestDouble::$aAsked, 0));
    }

    public function testEmptyListFromTheOwnerStopsTheSearch()
    {
        BxDolAiChatHintsTestDouble::$aModules = ['bx_a', 'bx_b'];
        BxDolAiChatHintsTestDouble::$aAnswers = [
            'bx_a' => [],
            'bx_b' => [['type' => 'reply', 'label' => 'From b']],
        ];

        $this->assertSame([], BxDolAiChatHintsTestDouble::get(['id' => 15], 0));
        $this->assertSame(['bx_a'], array_column(BxDolAiChatHintsTestDouble::$aAsked, 0));
    }

    public function testAgentAndContextArePassedToTheModule()
    {
        BxDolAiChatHintsTestDouble::$aModules = ['bx_a'];
        BxDolAiChatHintsTestDouble::$aAnswers = ['bx_a' => []];

        BxDolAiChatHintsTestDouble::get(['id' => '15'], '7');
        $this->assertSame([['bx_a', 15, 7]], BxDolAiChatHintsTestDouble::$aAsked);
    }

    public function testHintsAreSanitizedAndCapped()
    {
        BxDolAiChatHintsTestDouble::$aModules = ['bx_a'];
        BxDolAiChatHintsTestDouble::$aAnswers = ['bx_a' => [
            ['type' => 'reply', 'label' => '  '],
            ['type' => 'link', 'label' => 'Bad', 'url' => 'javascript:alert(1)'],
            ['type' => 'script', 'label' => 'Bad too'],
            ['type' => 'reply', 'label' => 'One'],
            ['type' => 'reply', 'label' => 'Two'],
            ['type' => 'reply', 'label' => 'Three'],
            ['type' => 'reply', 'label' => 'Four'],
            ['type' => 'reply', 'label' => 'Five'],
        ]];

        $this->assertSame(
            ['One', 'Two', 'Three', 'Four'],
            array_column(BxDolAiChatHintsTestDouble::get(['id' => 15], 0), 'label')
        );
    }

    public function testHintIconIsAnHttpsImageOrAFewSymbols()
    {
        $this->assertSame([
            ['type' => 'reply', 'label' => 'Image', 'image' => 'https://una.io/p.png'],
            ['type' => 'reply', 'label' => 'Image wins', 'image' => 'https://una.io/p.png'],
            ['type' => 'reply', 'label' => 'Emoji', 'emoji' => '🚀'],
            ['type' => 'reply', 'label' => 'No icon'],
        ], BxDolAiChatHints::sanitize([
            ['type' => 'reply', 'label' => 'Image', 'image' => 'https://una.io/p.png'],
            ['type' => 'reply', 'label' => 'Image wins', 'image' => 'https://una.io/p.png', 'emoji' => '🚀'],
            ['type' => 'reply', 'label' => 'Emoji', 'emoji' => ' 🚀 '],
            ['type' => 'reply', 'label' => 'No icon', 'image' => 'http://una.io/p.png', 'emoji' => '<b>x</b>'],
        ]));
    }

    public function testUnknownContextProfileAsksNoModule()
    {
        $this->assertSame([], BxDolAiChatHints::get(['id' => 15], 2147483000));
    }

    public function testEndpointGivesUnknownAgentNoHints()
    {
        $o = new class extends BxDolAiTriggerChat {
            public function hintsJson($iAgentId)
            {
                ob_start();
                $this->hints($iAgentId);
                return ob_get_clean();
            }
        };

        $this->assertSame(['hints' => []], json_decode($o->hintsJson(0), true));
        $this->assertSame(['hints' => []], json_decode($o->hintsJson(2147483000), true));
    }
}

/**
 * The module lookup replaced by fixed answers, so the cases do not depend on the
 * modules installed on the test site.
 */
class BxDolAiChatHintsTestDouble extends BxDolAiChatHints
{
    /** @var string[] */
    public static $aModules = [];

    /** @var array<string, array|null> module => its answer; missing = no such service */
    public static $aAnswers = [];

    /** @var array<int, array{0: string, 1: int, 2: int}> */
    public static $aAsked = [];

    protected static function modulesFor($iContextPid)
    {
        return static::$aModules;
    }

    protected static function askModule($sModule, $iAgentId, $iContextPid)
    {
        static::$aAsked[] = [$sModule, $iAgentId, $iContextPid];
        return static::$aAnswers[$sModule] ?? null;
    }
}
