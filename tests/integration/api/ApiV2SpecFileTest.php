<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The OpenAPI document in the repository (neo/desktop/una-api/openapi.json, what the clients'
 * types are generated from) is what the code serves.
 *
 * A site lists only the modules it has installed, so the file is taken from a site with all of
 * them, and a site with fewer serves a part of it: everything this site serves must be in the
 * file, word for word. Where this site serves every path of the file, the file must hold
 * nothing more either.
 *
 * When it fails, the API changed and the file did not (or the other way round). If the change
 * is meant, take the file again from a site with every module with an API enabled, and
 * regenerate the types (see docs/api-v2.md, "Versions and changes"):
 *   cd neo/desktop/una-api && UNA_URL=<site> node scripts/fetch-spec.mjs && yarn generate
 */
#[Group('integration')]
class ApiV2SpecFileTest extends BxDolTestCase
{
    const FILE = 'neo/desktop/una-api/openapi.json';

    public function testTheCommittedDocumentIsWhatTheCodeServes(): void
    {
        $sFile = BX_DIRECTORY_PATH_ROOT . self::FILE;
        if (!is_file($sFile))
            $this->markTestSkipped(self::FILE . ' is not in this checkout.');
        // an operation's `security` lists OAuth only where the module is on, as on the site the file was taken from
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_oauth'))
            $this->markTestSkipped('bx_oauth is not installed.');

        $aFile = json_decode((string)file_get_contents($sFile), true);
        $this->assertIsArray($aFile, self::FILE . ' is not JSON');

        BxDolApiV2Router::reset();
        try {
            // through JSON, as a client gets it
            $aSite = json_decode(BxDolApiV2Router::json((new BxDolApiV2Spec(new BxDolApiV2Router()))->build()), true);
        } finally {
            BxDolApiV2Router::reset();
        }

        $aDiffers = [];
        $aMissing = [];

        $this->assertSame($aFile['openapi'], $aSite['openapi']);
        // the title and the server are the site's own; fetch-spec.mjs makes them neutral
        foreach (['version', 'summary', 'description', 'license'] as $sKey)
            if (($aFile['info'][$sKey] ?? null) !== ($aSite['info'][$sKey] ?? null))
                $aDiffers[] = 'info.' . $sKey;

        foreach ($aSite['paths'] as $sPath => $aMethods)
            foreach ($aMethods as $sMethod => $aOperation) {
                $sName = strtoupper($sMethod) . ' ' . $sPath;
                if (!isset($aFile['paths'][$sPath][$sMethod]))
                    $aMissing[] = $sName;
                elseif ($aFile['paths'][$sPath][$sMethod] !== $aOperation)
                    $aDiffers[] = $sName . ' (' . implode(', ', self::differingKeys($aFile['paths'][$sPath][$sMethod], $aOperation)) . ')';
            }

        foreach ($aSite['components'] as $sSection => $aEntries)
            foreach ($aEntries as $sEntry => $aEntry) {
                $sName = 'components.' . $sSection . '.' . $sEntry;
                if (!isset($aFile['components'][$sSection][$sEntry]))
                    $aMissing[] = $sName;
                elseif ($aFile['components'][$sSection][$sEntry] !== $aEntry)
                    $aDiffers[] = $sName . ' (' . implode(', ', self::differingKeys($aFile['components'][$sSection][$sEntry], $aEntry)) . ')';
            }

        $aFileTags = array_column($aFile['tags'], 'description', 'name');
        foreach ($aSite['tags'] as $aTag)
            if (!array_key_exists($aTag['name'], $aFileTags))
                $aMissing[] = 'tag ' . $aTag['name'];
            elseif ($aFileTags[$aTag['name']] !== ($aTag['description'] ?? null))
                $aDiffers[] = 'tag ' . $aTag['name'];

        $sHow = "\nIf the change is meant: cd neo/desktop/una-api && UNA_URL=<a site with every API module> node scripts/fetch-spec.mjs && yarn generate";
        $this->assertSame([], $aMissing, 'The code serves what ' . self::FILE . ' does not have.' . $sHow);
        $this->assertSame([], $aDiffers, 'The code and ' . self::FILE . ' say different things.' . $sHow);

        // a site with every module the file was taken with: the file has nothing the code dropped
        if (!array_diff_key($aFile['paths'], $aSite['paths'])) {
            $aGone = [];
            foreach ($aFile['paths'] as $sPath => $aMethods)
                foreach (array_keys(array_diff_key($aMethods, $aSite['paths'][$sPath])) as $sMethod)
                    $aGone[] = strtoupper($sMethod) . ' ' . $sPath;
            foreach ($aFile['components'] as $sSection => $aEntries)
                foreach (array_keys(array_diff_key($aEntries, $aSite['components'][$sSection] ?? [])) as $sEntry)
                    $aGone[] = 'components.' . $sSection . '.' . $sEntry;
            $this->assertSame([], $aGone, self::FILE . ' has what the code no longer serves.' . $sHow);
        }
    }

    /**
     * The top-level keys two entries differ in, for a message that says where to look.
     */
    protected static function differingKeys($mA, $mB): array
    {
        if (!is_array($mA) || !is_array($mB))
            return ['value'];

        $aKeys = [];
        foreach (array_unique(array_merge(array_keys($mA), array_keys($mB))) as $sKey)
            if (!array_key_exists($sKey, $mA) || !array_key_exists($sKey, $mB) || $mA[$sKey] !== $mB[$sKey])
                $aKeys[] = (string)$sKey;
        return $aKeys;
    }
}
