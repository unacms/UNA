<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Moment in the scripts every page loads (the preloader's 'datetime_js', BxBaseServices::_getPreloaderMoment): its
 * core and the locale of the viewer's language only, not the build with every locale.
 */
#[Group('integration')]
class PreloaderMomentTest extends BxDolIntegrationTestCase
{
    const CORE = '{dir_plugins_public}moment/|moment.min.js';

    protected function setUp(): void
    {
        parent::setUp();

        if (!file_exists(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'moment/moment.min.js') || !file_exists(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'moment/locale/ru.js'))
            $this->markTestSkipped('plugins_public has no split Moment files (yarn build:moment).');
    }

    protected function _files(string $sLangCode)
    {
        $oMethod = new ReflectionMethod('BxBaseServices', '_getPreloaderMoment');
        $oMethod->setAccessible(true);

        return $oMethod->invoke(new BxBaseServices(), $sLangCode);
    }

    #[DataProvider('providerForLocales')]
    public function testTheLocaleIsTheLanguages(string $sLangCode, string $sLocale): void
    {
        $this->assertSame([self::CORE, '{dir_plugins_public}moment/locale/|' . $sLocale . '.js'], $this->_files($sLangCode));
    }

    static public function providerForLocales()
    {
        return [
            'a language' => ['ru', 'ru'],
            'a language with a country Moment has' => ['pt-BR', 'pt-br'],
            'a country Moment has none for: the language' => ['ru-RU', 'ru'],
            'an underscore' => ['en_GB', 'en-gb'],
        ];
    }

    #[DataProvider('providerForCoreOnly')]
    public function testEnglishAndUnknownLanguagesGetTheCoreAlone(string $sLangCode): void
    {
        $this->assertSame([self::CORE], $this->_files($sLangCode));
    }

    static public function providerForCoreOnly()
    {
        return [
            'English' => ['en'],
            'English of a country without a locale' => ['en-US'],
            'no such language' => ['qq'],
            'empty' => [''],
            'not a language code' => ['../../../inc/header.inc'],
        ];
    }

    public function testThePreloaderServiceAnswersForTheViewersLanguage(): void
    {
        $a = BxDolService::call('system', 'get_preloader_content', ['datetime_js'], 'BaseServices');

        $this->assertIsArray($a);
        $this->assertSame(self::CORE, $a[0]);
        $this->assertLessThanOrEqual(2, count($a));
    }
}
