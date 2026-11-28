<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Checks a value against the JSON Schema subset API v2 schemas use: type (also a list, for
 * nullable), properties, required, additionalProperties: false, items, enum, const,
 * minLength/maxLength, minimum/maximum, minItems/maxItems, pattern, oneOf, and $ref to
 * #/components/schemas/<name>. The router checks request bodies with it; contract tests check
 * responses.
 */
class BxDolApiV2Validator
{
    protected $_aComponents;

    public function __construct($aComponents)
    {
        $this->_aComponents = $aComponents;
    }

    /**
     * @return array field errors, empty when the value is valid
     */
    public function validate($mValue, $aSchema, $sPath = '')
    {
        $aErrors = [];
        $this->_check($mValue, $aSchema, $sPath, $aErrors);
        return $aErrors;
    }

    protected function _check($mValue, $aSchema, $sPath, &$aErrors)
    {
        if (isset($aSchema['$ref'])) {
            $sName = substr($aSchema['$ref'], strlen('#/components/schemas/'));
            if (!isset($this->_aComponents[$sName])) {
                $aErrors[] = $this->_err($sPath, 'schema_error', 'Unknown schema ' . $sName);
                return;
            }
            $this->_check($mValue, $this->_aComponents[$sName], $sPath, $aErrors);
            return;
        }

        if (isset($aSchema['oneOf'])) {
            $iMatches = 0;
            foreach ($aSchema['oneOf'] as $aOption)
                if (!$this->validate($mValue, $aOption, $sPath))
                    $iMatches++;
            if ($iMatches !== 1)
                $aErrors[] = $this->_err($sPath, 'invalid_value', 'Must match exactly one of the allowed shapes');
            return;
        }

        if (isset($aSchema['type'])) {
            $aTypes = (array)$aSchema['type'];
            if (!$this->_isOfType($mValue, $aTypes)) {
                $aErrors[] = $this->_err($sPath, 'invalid_type', 'Must be ' . implode(' or ', $aTypes));
                return;
            }
            if ($mValue === null)
                return;
        }

        if (array_key_exists('const', $aSchema) && $mValue !== $aSchema['const'])
            $aErrors[] = $this->_err($sPath, 'invalid_value', 'Must be ' . json_encode($aSchema['const']));

        if (isset($aSchema['enum']) && !in_array($mValue, $aSchema['enum'], true))
            $aErrors[] = $this->_err($sPath, 'invalid_value', 'Must be one of: ' . implode(', ', array_map('json_encode', $aSchema['enum'])));

        if (is_string($mValue)) {
            $iLen = mb_strlen($mValue);
            if (isset($aSchema['minLength']) && $iLen < $aSchema['minLength'])
                $aErrors[] = $this->_err($sPath, $aSchema['minLength'] == 1 ? 'required' : 'too_short', 'Must be at least ' . $aSchema['minLength'] . ' characters');
            if (isset($aSchema['maxLength']) && $iLen > $aSchema['maxLength'])
                $aErrors[] = $this->_err($sPath, 'too_long', 'Must be at most ' . $aSchema['maxLength'] . ' characters');
            if (isset($aSchema['pattern']) && !preg_match('/' . str_replace('/', '\/', $aSchema['pattern']) . '/u', $mValue))
                $aErrors[] = $this->_err($sPath, 'invalid_format', 'Has the wrong format');
        }

        if (is_int($mValue) || is_float($mValue)) {
            if (isset($aSchema['minimum']) && $mValue < $aSchema['minimum'])
                $aErrors[] = $this->_err($sPath, 'out_of_range', 'Must be at least ' . $aSchema['minimum']);
            if (isset($aSchema['maximum']) && $mValue > $aSchema['maximum'])
                $aErrors[] = $this->_err($sPath, 'out_of_range', 'Must be at most ' . $aSchema['maximum']);
        }

        if (is_array($mValue) && array_is_list($mValue) && (in_array('array', (array)($aSchema['type'] ?? []), true) || isset($aSchema['items']))) {
            if (isset($aSchema['minItems']) && count($mValue) < $aSchema['minItems'])
                $aErrors[] = $this->_err($sPath, 'too_short', 'Needs at least ' . $aSchema['minItems'] . ' items');
            if (isset($aSchema['maxItems']) && count($mValue) > $aSchema['maxItems'])
                $aErrors[] = $this->_err($sPath, 'too_long', 'Takes at most ' . $aSchema['maxItems'] . ' items');
            if (isset($aSchema['items']))
                foreach ($mValue as $i => $mItem)
                    $this->_check($mItem, $aSchema['items'], $sPath . '[' . $i . ']', $aErrors);
            return;
        }

        if (is_array($mValue) && (isset($aSchema['properties']) || isset($aSchema['required']))) {
            foreach ($aSchema['required'] ?? [] as $sKey)
                if (!array_key_exists($sKey, $mValue))
                    $aErrors[] = $this->_err($this->_join($sPath, $sKey), 'required', 'Is required');

            foreach ($mValue as $sKey => $mItem) {
                if (isset($aSchema['properties'][$sKey]))
                    $this->_check($mItem, $aSchema['properties'][$sKey], $this->_join($sPath, $sKey), $aErrors);
                elseif (isset($aSchema['additionalProperties']) && $aSchema['additionalProperties'] === false)
                    $aErrors[] = $this->_err($this->_join($sPath, $sKey), 'unknown_field', 'Is not a field of this request');
                elseif (isset($aSchema['additionalProperties']) && is_array($aSchema['additionalProperties']))
                    $this->_check($mItem, $aSchema['additionalProperties'], $this->_join($sPath, $sKey), $aErrors);
            }
        }
    }

    protected function _isOfType($mValue, $aTypes)
    {
        foreach ($aTypes as $sType) {
            switch ($sType) {
                case 'null':    if ($mValue === null) return true; break;
                case 'string':  if (is_string($mValue)) return true; break;
                case 'integer': if (is_int($mValue)) return true; break;
                case 'number':  if (is_int($mValue) || is_float($mValue)) return true; break;
                case 'boolean': if (is_bool($mValue)) return true; break;
                // PHP decodes {} and [] alike: an empty array passes as either
                case 'array':   if (is_array($mValue) && array_is_list($mValue)) return true; break;
                case 'object':  if (is_array($mValue) && (!$mValue || !array_is_list($mValue))) return true; break;
            }
        }
        return false;
    }

    protected function _join($sPath, $sKey)
    {
        return $sPath === '' ? (string)$sKey : $sPath . '.' . $sKey;
    }

    protected function _err($sField, $sCode, $sMessage)
    {
        return ['field' => $sField === '' ? '(body)' : $sField, 'code' => $sCode, 'message' => $sMessage];
    }
}

/** @} */
