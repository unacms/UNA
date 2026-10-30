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

    public function keywordToLists(array $aResult): array
    {
        $this->_keywordToLists($aResult);
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
            ['interpreter', ['interpreting'], true],
            ['translator', ['translation'], true],
            ['conference', ['consecutive'], false],
        ];
    }

    private function taggedFields(): array
    {
        return [
            'title' => ['kind' => 'text', 'caption' => 'Title', 'search_type' => 'text', 'operator' => 'like'],
            'labels' => ['kind' => 'list', 'caption' => 'Skills', 'multi' => true, 'search_type' => 'checkbox_set', 'operator' => 'like', 'values' => [
                'Translation' => 'Translation',
                'Consecutive interpreting' => 'Consecutive interpreting',
                'Simultaneous interpreting' => 'Simultaneous interpreting',
            ]],
            'expertise' => ['kind' => 'list', 'caption' => 'Expertise', 'multi' => true, 'search_type' => 'checkbox_set', 'operator' => 'like', 'values' => [
                'Textile' => 'Textile',
                'Legal' => 'Legal',
            ]],
            'location' => ['kind' => 'location', 'caption' => 'Location', 'search_type' => 'location', 'operator' => 'locate'],
        ];
    }

    private function keywordResult(string $sKeyword, array $aMore = []): array
    {
        $a = [
            'keyword_field' => 'title',
            'search_params' => ['title' => ['type' => 'text', 'value' => $sKeyword, 'operator' => 'like']],
            'filters' => ['title' => $sKeyword],
            'chips' => ['title' => ['field' => 'title', 'caption' => 'Title', 'label' => $sKeyword, 'value' => $sKeyword]],
            'confidence' => ['title' => 0.9],
        ];
        foreach ($aMore as $sName => $aParam) {
            $a['search_params'][$sName] = ['value' => $aParam['value']];
            $a['chips'][$sName] = ['field' => $sName, 'label' => $aParam['label'], 'value' => $aParam['value']];
        }

        return $a;
    }

    public function testRoleWordSearchesEveryTagWithIt()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields($this->taggedFields());

        $a = $o->keywordToLists($this->keywordResult('interpreter'));

        $this->assertSame(['Consecutive interpreting', 'Simultaneous interpreting'], $a['search_params']['labels']['value']);
        $this->assertSame(['Consecutive interpreting', 'Simultaneous interpreting'], $a['filters']['labels']);
        $this->assertArrayNotHasKey('title', $a['search_params']);
        $this->assertSame('', $a['keyword_field']);
    }

    public function testTagWordKeepsTheModelsChoice()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields($this->taggedFields());

        // the model picked Simultaneous for "conference interpreting": the word does not widen it
        $a = $o->keywordToLists($this->keywordResult('interpreting java', [
            'labels' => ['value' => 'Simultaneous interpreting', 'label' => 'Simultaneous interpreting'],
        ]));

        $this->assertSame('Simultaneous interpreting', $a['search_params']['labels']['value']);
        $this->assertSame('java', $a['search_params']['title']['value']);
    }

    public function testPlaceWordLeavesTheKeyword()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields($this->taggedFields());
        $o->setAnswers(['loc_city' => ['choice' => 'vietnam', 'confidence' => 1]]);

        $a = $o->dropKeywordOfLists($this->keywordResult('vietnam', [
            'location' => ['value' => ['array' => [], 'string' => 'Vietnam'], 'label' => 'Vietnam'],
        ]));

        $this->assertArrayNotHasKey('title', $a['search_params']);
        $this->assertArrayHasKey('location', $a['search_params']);
    }

    public function testTagWordsOfOneFieldAreSearchedTogether()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields($this->taggedFields());

        $a = $o->keywordToLists($this->keywordResult('translation interpreting'));

        $this->assertSame(['Translation', 'Consecutive interpreting', 'Simultaneous interpreting'], $a['search_params']['labels']['value']);
        $this->assertArrayNotHasKey('title', $a['search_params']);
    }

    public function testPlaceWordStaysWhenNoPlaceWasFound()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $o->setFields($this->taggedFields());
        $o->setAnswers(['loc_city' => ['choice' => 'vietnam', 'confidence' => 1]]);

        // the geocoder failed: no location filter, so the word keeps searching the title
        $a = $o->dropKeywordOfLists($this->keywordResult('vietnam'));

        $this->assertSame('vietnam', $a['search_params']['title']['value']);
        $this->assertSame('title', $a['keyword_field']);
    }

    public function testSeveralLikeValuesAreSearchedTogether()
    {
        $o = new BxDolAiSearchExtParserTestDouble();
        $aFields = $this->taggedFields();

        $a = $o->call('_getListParam', $aFields['labels'], ['Consecutive interpreting', 'Simultaneous interpreting'], 0.8);
        $this->assertSame(['Consecutive interpreting', 'Simultaneous interpreting'], $a['value']);
        $this->assertSame('Consecutive interpreting, Simultaneous interpreting', $a['label']);

        $a = $o->call('_getListParam', $aFields['labels'], ['Translation'], 0.8);
        $this->assertSame('Translation', $a['value']);
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
