<?php

/**
 * _tn: a count in the plural form it needs ("1 view", "2 views"), with the key itself as fallback.
 */
class BxDolLanguagesPluralTest extends \PHPUnit\Framework\TestCase
{
    private $aLangBackup;
    private $sLangBackup;

    protected function setUp(): void
    {
        $this->aLangBackup = $GLOBALS['LANG'] ?? [];
        $this->sLangBackup = $GLOBALS['sCurrentLanguage'] ?? null;

        $GLOBALS['LANG']['_test_n_views'] = '{0} views';
        $GLOBALS['LANG']['_test_n_views_one'] = '{0} view';
        $GLOBALS['LANG']['_test_n_votes'] = '{0} votes on {1}';
        $GLOBALS['LANG']['_test_n_votes_one'] = '{0} vote on {1}';
        $GLOBALS['LANG']['_test_ru'] = '{0} просмотров';
        $GLOBALS['LANG']['_test_ru_one'] = '{0} просмотр';
        $GLOBALS['LANG']['_test_ru_few'] = '{0} просмотра';
        $GLOBALS['LANG']['_test_only_base'] = '{0} items';
    }

    protected function tearDown(): void
    {
        $GLOBALS['LANG'] = $this->aLangBackup;
        if ($this->sLangBackup === null)
            unset($GLOBALS['sCurrentLanguage']);
        else
            $GLOBALS['sCurrentLanguage'] = $this->sLangBackup;
    }

    public function testEnglishOneAndOther()
    {
        $GLOBALS['sCurrentLanguage'] = 'en';

        $this->assertSame('1 view', _tn('_test_n_views', 1));
        $this->assertSame('0 views', _tn('_test_n_views', 0));
        $this->assertSame('2 views', _tn('_test_n_views', 2));
        $this->assertSame('21 views', _tn('_test_n_views', 21));
        $this->assertSame('1 view', _tn('_test_n_views', '1'));
    }

    public function testMoreArgumentsAreKept()
    {
        $GLOBALS['sCurrentLanguage'] = 'en';

        $this->assertSame('1 vote on Cats', _tn('_test_n_votes', 1, 'Cats'));
        $this->assertSame('3 votes on Cats', _tn('_test_n_votes', 3, 'Cats'));
    }

    public function testRussianForms()
    {
        $GLOBALS['sCurrentLanguage'] = 'ru';

        $this->assertSame('1 просмотр', _tn('_test_ru', 1));
        $this->assertSame('21 просмотр', _tn('_test_ru', 21));
        $this->assertSame('2 просмотра', _tn('_test_ru', 2));
        $this->assertSame('24 просмотра', _tn('_test_ru', 24));
        $this->assertSame('5 просмотров', _tn('_test_ru', 5));
        $this->assertSame('11 просмотров', _tn('_test_ru', 11));
        $this->assertSame('12 просмотров', _tn('_test_ru', 12));
        $this->assertSame('111 просмотров', _tn('_test_ru', 111));
        // no `_many` key: the key itself
        $this->assertSame('0 просмотров', _tn('_test_ru', 0));
    }

    public function testMissingFormFallsBackToTheKey()
    {
        $GLOBALS['sCurrentLanguage'] = 'en';

        $this->assertSame('1 items', _tn('_test_only_base', 1));
        $this->assertSame('_test_missing', _tn('_test_missing', 1));
    }

    public function testNonIntegerCountUsesTheKey()
    {
        $GLOBALS['sCurrentLanguage'] = 'en';

        $this->assertSame('1.5 views', _tn('_test_n_views', '1.5'));
        $this->assertSame('', BxDolLanguages::getInstance()->getPluralForm('abc', 'en'));
    }
}
