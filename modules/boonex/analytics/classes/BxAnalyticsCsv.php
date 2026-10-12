<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * CSV downloads of reports. Paths, titles, referrers and campaign tags come from visitors, so
 * a text cell that a spreadsheet would read as a formula is turned into plain text.
 */
class BxAnalyticsCsv
{
    /**
     * A character that makes a spreadsheet evaluate a cell it starts, where a cell can start:
     * at the start of the text, and after a ; or a line break. Spreadsheets in many locales
     * (Russian, German, French) split a CSV line on ;, and a quote in the middle of a field
     * doesn't enclose anything, so 'x;=1+1' would be two cells, the second a formula.
     * Every character here is ASCII, which never occurs inside a multibyte UTF-8 character,
     * so the pattern works on bytes and never fails on broken text.
     */
    const FORMULA_PATTERN = '/(?:^|(?<=[;\r\n]))( *)([=+\-@\t\r])/';

    /**
     * A cell: numbers as they are, text with a ' before anything that would start a formula.
     */
    public static function cell($mixedValue)
    {
        if(is_int($mixedValue) || is_float($mixedValue))
            return $mixedValue;

        if(is_bool($mixedValue))
            return (int)$mixedValue;

        $sValue = (string)$mixedValue;
        if($sValue === '')
            return $sValue;

        return preg_replace(self::FORMULA_PATTERN, "$1'$2", $sValue);
    }

    /**
     * A download's file name from known parts only: analytics-<report>-<dimension>-<from>-<to>.csv.
     * Anything but letters, digits, _ and - is dropped from each part.
     */
    public static function getFilename($aParts)
    {
        $aResult = ['analytics'];
        foreach($aParts as $sPart) {
            $sPart = preg_replace('/[^A-Za-z0-9_-]+/', '', (string)$sPart);
            if($sPart !== '')
                $aResult[] = $sPart;
        }

        return implode('-', $aResult) . '.csv';
    }

    /**
     * Write a header row and rows to a stream: UTF-8 with a byte order mark (so spreadsheets
     * read it as UTF-8), commas, quotes doubled inside quoted cells.
     *
     * @param resource $rStream
     * @param array $aHeader column titles
     * @param array $aRows rows of cells
     */
    public static function write($rStream, $aHeader, $aRows)
    {
        fwrite($rStream, "\xEF\xBB\xBF");

        fputcsv($rStream, array_map([self::class, 'cell'], array_values($aHeader)), ',', '"', '');
        foreach($aRows as $aRow)
            fputcsv($rStream, array_map([self::class, 'cell'], array_values($aRow)), ',', '"', '');
    }
}

/** @} */
