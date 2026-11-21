<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

// BX_DOL_PG_ALL is defined in the class file, which the autoloader loads only when the class is used.
bx_import('BxDolPrivacy');

/**
 * Database queries for BxDolSitemap.
 */
class BxDolSitemapQuery extends BxDolDb
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Links of a menu that guests see.
     * @param string $sMenuSet menu set name
     * @return array rows with `link`
     */
    public function getGuestMenuLinks($sMenuSet)
    {
        return $this->getAll("SELECT `link` FROM `sys_menu_items` WHERE `set_name` = :set_name AND `active` = 1 AND (`visible_for_levels` & 1) AND `link` <> '' ORDER BY `order` ASC", [
            'set_name' => $sMenuSet,
        ]);
    }

    /**
     * Links of the pages that ask search engines not to index them (`meta_robots`).
     * @return array of `url` values (page.php?i=...)
     */
    public function getNoindexPageUrls()
    {
        return $this->getColumn("SELECT `url` FROM `sys_objects_page` WHERE `meta_robots` LIKE '%noindex%' AND `url` <> ''");
    }

    /**
     * Entries of a content module that anyone may see, newest first.
     * @param array $aParams table, field_id, field_allow_view_to (all required); field_date, field_status,
     *        field_status_admin, field_cf, cf_guest (allowed content filter bits for guests), cf_prohibited (values),
     *        profile_type (a profile module: only active profiles), limit
     * @return array rows with `id` and `date` (unix time, 0 when unknown)
     */
    public function getPublicEntries($aParams)
    {
        $sTable = $this->_ident($aParams['table']);
        $sFieldId = $this->_ident($aParams['field_id']);

        $sDate = !empty($aParams['field_date']) ? "`c`." . $this->_ident($aParams['field_date']) : '0';

        $aBind = ['public' => BX_DOL_PG_ALL];
        $sJoin = '';
        $sWhere = " AND `c`." . $this->_ident($aParams['field_allow_view_to']) . " = :public";

        if(!empty($aParams['field_status'])) {
            $sWhere .= " AND `c`." . $this->_ident($aParams['field_status']) . " = 'active'";
        }
        if(!empty($aParams['field_status_admin'])) {
            $sWhere .= " AND `c`." . $this->_ident($aParams['field_status_admin']) . " = 'active'";
        }

        if(!empty($aParams['field_cf'])) {
            $sCf = "`c`." . $this->_ident($aParams['field_cf']);
            // 0 is the default value, as BxDolContentFilter::isAllowedByViewer reads it.
            $sCfValue = "IF(" . $sCf . " = 0, " . max(1, (int)($aParams['cf_default'] ?? 1)) . ", " . $sCf . ")";
            $sWhere .= " AND (1 << (" . $sCfValue . " - 1)) & " . (int)$aParams['cf_guest'];
            if(!empty($aParams['cf_prohibited'])) {
                $sWhere .= " AND " . $sCf . " NOT IN (" . $this->implode_escape($aParams['cf_prohibited']) . ")";
            }
        }

        if(!empty($aParams['profile_type'])) {
            $sJoin = " INNER JOIN `sys_profiles` AS `p` ON `p`.`content_id` = `c`." . $sFieldId . " AND `p`.`type` = :profile_type AND `p`.`status` = 'active'";
            $aBind['profile_type'] = $aParams['profile_type'];
        }

        return $this->getAll("SELECT `c`." . $sFieldId . " AS `id`, " . $sDate . " AS `date` FROM " . $sTable . " AS `c`" . $sJoin . " WHERE 1" . $sWhere . " ORDER BY `c`." . $sFieldId . " DESC LIMIT " . (int)$aParams['limit'], $aBind);
    }

    /**
     * A table or column name from a module's config, quoted; the name must be a plain identifier.
     */
    protected function _ident($s)
    {
        if(!preg_match('/^[A-Za-z0-9_]+$/', (string)$s))
            throw new InvalidArgumentException('Not an identifier: ' . $s);

        return '`' . $s . '`';
    }
}

/** @} */
