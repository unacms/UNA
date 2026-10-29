<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Exposes the parser's helpers without a judge model: answers are set by the test.
 */
class BxDolAiSearchExtParserTestDouble extends BxDolAiSearchExtParser
{
    public function __construct()
    {
    }

    public function setFields(array $aFields)
    {
        $this->_aFields = $aFields;
    }

    public function setAnswers(array $aAnswers)
    {
        $this->_aAnswers = $aAnswers;
    }

    public function call(string $sMethod, ...$aArgs)
    {
        return $this->$sMethod(...$aArgs);
    }

    public function dropKeywordOfLists(array $aResult): array
    {
        $this->_dropKeywordOfLists($aResult);
        return $aResult;
    }
}

/**
 * Extended AI search parser: long lists in parts, same captions, keyword words taken by list values.
 */
class BxDolAiSearchExtParserTest extends \PHPUnit\Framework\TestCase
{
    private function listField(int $iValues, string $sCaption = 'Language'): array
    {
        $aValues = [];
        for ($i = 1; $i <= $iValues; $i++)
            $aValues[(string)$i] = 'Value ' . $i;

        return ['kind' => 'list', 'caption' => $sCaption, 'values' => $aValues, 'multi' => false, 'operator' => '='];
    }

    #[DataProvider('providerForListQuestionIds')]
    public function testListQuestionIds(int $iValues, array $aIds)
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $this->assertSame($aIds, $o->call('_getListQuestionIds', 'lang', $this->listField($iValues)));
    }

    static public function providerForListQuestionIds()
    {
        return [
            [1, ['f_lang']],
            [BxDolAiSearchExtParser::LIST_CHUNK, ['f_lang']],
            [BxDolAiSearchExtParser::LIST_CHUNK + 1, ['f_lang', 'f_lang__1']],
            [BxDolAiSearchExtParser::LIST_CHUNK * 2 + 50, ['f_lang', 'f_lang__1', 'f_lang__2']],
        ];
    }

    public function testListAnswerTakesTheMostConfidentPart()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setAnswers([
            'f_lang' => ['choice' => BxDolAiSearchParser::NONE, 'confidence' => 0.95],
            'f_lang__1' => ['choice' => '250', 'confidence' => 0.6],
        ]);

        $a = $o->call('_answerList', 'lang', $this->listField(298));
        $this->assertSame('250', $a['value']);
        $this->assertSame('Value 250', $a['label']);
    }

    public function testListAnswerIsEmptyWhenEveryPartSaysNone()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setAnswers([
            'f_lang' => ['choice' => BxDolAiSearchParser::NONE, 'confidence' => 0.9],
            'f_lang__1' => ['choice' => BxDolAiSearchParser::NONE, 'confidence' => 0.9],
        ]);

        $this->assertNull($o->call('_answerList', 'lang', $this->listField(298)));
    }

    public function testSameCaptionsAreQualifiedExceptNumbers()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $aFields = $o->call('_qualifySameCaptions', [
            'price_single' => ['kind' => 'number', 'caption' => 'Price'],
            'price_recurring' => ['kind' => 'number', 'caption' => 'Price'],
            'language_from' => ['kind' => 'list', 'caption' => 'Source Language'],
            'nl_native' => ['kind' => 'bool', 'caption' => 'Native'],
            'language_to' => ['kind' => 'list', 'caption' => 'Target Language'],
            'sl_native' => ['kind' => 'bool', 'caption' => 'Native'],
        ]);

        $this->assertSame('Price', $aFields['price_single']['caption']);
        $this->assertSame('Price', $aFields['price_recurring']['caption']);
        $this->assertSame('Native (Source Language)', $aFields['nl_native']['caption']);
        $this->assertSame('Native (Target Language)', $aFields['sl_native']['caption']);
        $this->assertSame('Native', $aFields['sl_native']['caption_own']);
        $this->assertSame('Target Language', $aFields['sl_native']['caption_of']);

        // both prices stay one group: "under 10" limits each of them
        $o->setFields($aFields);
        $this->assertSame(['Price' => ['price_single', 'price_recurring']], $o->call('_getNumberGroups'));
    }

    #[DataProvider('providerForIsListWord')]
    public function testIsListWord(string $sToken, array $aWords, bool $bOut)
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $this->assertSame($bOut, $o->call('_isListWord', $sToken, array_fill_keys($aWords, true)));
    }

    static public function providerForIsListWord()
    {
        return [
            ['politics', ['politics'], true],
            ['politic', ['politics'], true],
            ['translators', ['translator'], true],
            ['java', ['javascript'], false],
            ['javascript', ['java'], false],
            ['dub', ['dubbing'], false],
            ['legal', ['medical'], false],
        ];
    }

    public function testKeywordKeepsOnlyWordsNoListValueTook()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields([
            'title' => ['kind' => 'text', 'caption' => 'Title'],
            'expertise' => ['kind' => 'list', 'caption' => 'Expertise'],
        ]);

        $a = $o->dropKeywordOfLists([
            'keyword_field' => 'title',
            'search_params' => ['title' => ['value' => 'politic java'], 'expertise' => ['value' => 'Politics']],
            'filters' => ['title' => 'politic java', 'expertise' => ['Politics']],
            'chips' => [
                'title' => ['label' => 'politic java', 'value' => 'politic java'],
                'expertise' => ['label' => 'Politics', 'value' => 'Politics'],
            ],
            'confidence' => ['title' => 0.9, 'expertise' => 0.9],
        ]);

        $this->assertSame('java', $a['search_params']['title']['value']);
        $this->assertSame('java', $a['filters']['title']);
        $this->assertSame('java', $a['chips']['title']['label']);
    }

    public function testKeywordIsDroppedWhenListValuesTookAllItsWords()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields([
            'title' => ['kind' => 'text', 'caption' => 'Title'],
            'expertise' => ['kind' => 'list', 'caption' => 'Expertise'],
        ]);

        $a = $o->dropKeywordOfLists([
            'keyword_field' => 'title',
            'search_params' => ['title' => ['value' => 'software'], 'expertise' => ['value' => 'Software']],
            'filters' => ['title' => 'software', 'expertise' => ['Software']],
            'chips' => [
                'title' => ['label' => 'software', 'value' => 'software'],
                'expertise' => ['label' => 'Software', 'value' => 'Software'],
            ],
            'confidence' => ['title' => 0.9, 'expertise' => 0.9],
        ]);

        $this->assertArrayNotHasKey('title', $a['search_params']);
        $this->assertArrayNotHasKey('title', $a['chips']);
        $this->assertSame('', $a['filters']['title']);
        $this->assertSame('', $a['keyword_field']);
    }
}
