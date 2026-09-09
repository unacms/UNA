<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioDashboard extends BxDolStudioDashboard
{
    public function __construct()
    {
        parent::__construct();
    }

    public function getPageCss()
    {
        return array_merge(parent::getPageCss(), array(
            'page_layouts.css', 
            'dashboard.css',
        ));
    }

    public function getPageJs()
    {
        return array_merge(parent::getPageJs(), array(
            'jquery.anim.js',
            'dashboard.js'
        ));
    }

    public function getPageJsClass()
    {
        return 'BxDolStudioDashboard';
    }

    public function getPageJsObject()
    {
        return 'oBxDolStudioDashboard';
    }

    public function getPageCaption()
    {
        return parent::getPageCaption() . $this->getPageJsCode();
    }

    public function getPageJsCode($aOptions = array(), $bWrap = true)
    {
        $aStatusTitles = [];
        foreach(['ok', 'warn', 'fail', 'undef'] as $sStatus)
            $aStatusTitles[$sStatus] = _t('_sys_audit_title_' . $sStatus);

        $aOptions = array_merge($aOptions, array(
            'sActionUrl' => BX_DOL_URL_STUDIO . 'dashboard.php',
            'aStatusTitles' => $aStatusTitles // the status words the Updates rows get once the check is in
        ));

        return parent::getPageJsCode($aOptions, $bWrap);
    }

    public function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;

    	$oPage = BxDolPage::getObjectInstance('sys_std_dashboard', BxDolStudioTemplate::getInstance());
    	return $sResult . $oPage->getCode();
    }

    /**
     * The Version block's asynchronous part: the system update state and the count of apps with updates, as status rows.
     */
    public function getPageCodeVersionAvailable()
    {
        // Row statuses are the status-row modifiers (ok / warn / undef); the audit class that names them isn't loaded here.
        // Latest Stable and Latest Beta each show the newest version on that channel: green when the site has it, orange when it is newer.
        $bUpgradeAvailable = false;
        $aRows = [];
        foreach(['stable', 'beta'] as $sChannel) {
            list($sVersion, $bNewer, $bUpgrade) = $this->getVersionChannelInfo($sChannel);

            if($sVersion)
                $aRows[$sChannel] = ['status' => $bNewer ? 'warn' : 'ok', 'value' => $sVersion];
            else
                $aRows[$sChannel] = ['status' => 'undef', 'value' => _t('_adm_dbd_txt_ht_na')];

            // the Update button in the block caption follows the channel the site is set to
            if($bUpgrade && $sChannel == (getParam('sys_upgrade_channel') == 'beta' ? 'beta' : 'stable'))
                $bUpgradeAvailable = true;
        }

        // The Apps row is named after the number of installed apps; its value is the number waiting for an update.
        $sApps = $this->getAppsCountText();
        $mixedUpdates = BxDolStudioInstallerUtils::getInstance()->checkUpdates();
        if(!is_array($mixedUpdates))
            $aApps = ['status' => 'undef', 'name' => $sApps, 'value' => _t('_adm_dbd_txt_ht_na')];
        else if(($iUpdates = count($mixedUpdates)) > 0)
            $aApps = ['status' => 'warn', 'name' => $sApps, 'value' => '<a href="' . BX_DOL_URL_STUDIO . 'store.php?page=updates">' . _t('_adm_dbd_txt_ver_apps_updates', $iUpdates) . '</a>'];
        else
            $aApps = ['status' => 'ok', 'name' => $sApps, 'value' => _t('_adm_dbd_txt_ver_up_to_date')];

        return [
            'upgrade' => (int)$bUpgradeAvailable,
            'stable' => $aRows['stable'],
            'beta' => $aRows['beta'],
            'apps' => $aApps
        ];
    }

    public function serviceGetWidgetNotices() {
    	$iResult = 0;

    	//--- Check Version: a newer release on the channel the site follows
    	list(, $bNewer) = $this->getVersionChannelInfo(getParam('sys_upgrade_channel') == 'beta' ? 'beta' : 'stable');
    	if($bNewer)
    		$iResult += 1;

    	//--- Check Host Requirements
		$oAudit = new BxDolStudioToolsAudit();

    	foreach($this->aItemsHTools as $sTitle => $sFunc) {
    		$aResult = $oAudit->checkRequirements(BX_DOL_AUDIT_FAIL, $sFunc);
			if(!empty($aResult)) {
				$iResult += 1;
				break;
			}
    	}

    	return $iResult;
    }

    /**
     * "23 Apps": everything installed besides the system itself (apps, templates and languages).
     */
    protected function getAppsCountText()
    {
        $iApps = 0;
        foreach(BxDolModuleQuery::getInstance()->getModules() as $aModule)
            if($aModule['type'] != 'system')
                $iApps++;

        return _t('_adm_dbd_txt_ver_apps_count', $iApps);
    }

    /**
     * Whether the site can receive automatic updates. They come with the UNA account's Pro and Max plans (https://unacms.com/start), which
     * the site joins with the marketplace key pair from Settings > System; swap the check for the account API's answer once it reports the plan.
     */
    public function isAutoUpdateAccess()
    {
        return getParam('sys_oauth_key') != '' && getParam('sys_oauth_secret') != '';
    }

    public function serviceGetBlockVersion()
    {
    	$sJsObject = $this->getPageJsObject();
        $aSysInfo = BxDolModuleQuery::getInstance()->getModuleByName('system');

        // The update switches mirror the Settings > General options.
        $aToggles = [
            ['name' => 'sys_autoupdate', 'title' => _t('_adm_dbd_txt_ver_auto'), 'icon' => 'refresh-cw', 'on' => getParam('sys_autoupdate') == 'on'],
            ['name' => 'sys_upgrade_channel', 'title' => _t('_adm_dbd_txt_ver_beta'), 'icon' => 'flask-conical', 'on' => getParam('sys_upgrade_channel') == 'beta'],
            ['name' => 'sys_autoupdate_force_modified_files', 'title' => _t('_adm_dbd_txt_ver_force'), 'icon' => 'zap', 'on' => getParam('sys_autoupdate_force_modified_files') == 'on'],
        ];
        $aTmplVarsToggles = [];
        foreach($aToggles as $aToggle)
            $aTmplVarsToggles[] = [
                'js_object' => $sJsObject,
                'name' => $aToggle['name'],
                'title' => $aToggle['title'],
                'icon' => $this->getChartIcon($aToggle['icon'])['svg'],
                'state' => $aToggle['on'] ? 'on' : 'off',
                'checked' => $aToggle['on'] ? 'true' : 'false',
                'checked_attr' => $aToggle['on'] ? 'checked' : ''
            ];

        // when the running version was applied: the last update, or the installation itself when it was never updated
        $iApplied = $aSysInfo['updated'] > 0 ? $aSysInfo['updated'] : $aSysInfo['date'];

        // the last status row: whether the site can receive automatic updates (see isAutoUpdateAccess)
        $bAccess = $this->isAutoUpdateAccess();

        $sContent = BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_versions.html', array(
            'js_object' => $sJsObject,
            'domain' => getParam('site_title'),
            'version' => bx_get_ver(),
            'version_time' => _t('_adm_dbd_txt_ver_applied', bx_time_js($iApplied, BX_FORMAT_DATE_TIME, true)),
            'bx_repeat:toggles' => $aTmplVarsToggles,
            'installed' => bx_time_js($aSysInfo['date'], BX_FORMAT_DATE, true),
            'updated' => bx_time_js($iApplied, BX_FORMAT_DATE, true),
            'icon_installed' => $this->getChartIcon('package-check')['svg'],
            'icon_updated' => $this->getChartIcon('history')['svg'],
            'icon_stable' => $this->getChartIcon('cloud-download')['svg'],
            'icon_beta' => $this->getChartIcon('flask-conical')['svg'],
            'icon_apps' => $this->getChartIcon('layout-grid')['svg'],
            'apps' => $this->getAppsCountText(),
            'checking' => _t('_adm_dbd_txt_ver_checking'),
            'icon_access' => $this->getChartIcon('badge-check')['svg'],
            'access_class' => $bAccess ? ' bx-dbd-htools-item-ok' : '', // the same bx_if twice in one row would be cut as one span by the template parser
            'bx_if:access_active' => ['condition' => $bAccess, 'content' => []],
            'bx_if:access_inactive' => ['condition' => !$bAccess, 'content' => [
                'access_url' => 'https://unacms.com/start' // a bx_if block only sees its own content
            ]]
        ));

        // The Update button sits in the block caption; dashboard.js shows it once the check finds an upgrade for the site's channel.
    	return array(
            'content' => $sContent,
            'menu' => '<button type="button" class="bx-btn bx-btn-primary bx-dbd-version-update" onclick="' . $sJsObject . '.performUpgrade()" style="display:none">' . _t('_adm_dbd_btn_update') . '</button>'
        );
    }

    /**
     * The system module's storage as Space rows per engine scope: the Storage app's files and images (an image's resized copies count
     * towards its size, not its file count), each linking to its tab of the Storage app, then everything else the system keeps (account
     * pictures, comment and editor images, wiki files, queues) as "System Media", linking to the Storage app itself. The system module has no icon of its own, and
     * resolving one would register a template location named 'system' and break page rendering, so these rows use Lucide glyphs.
     * @return array ['local' => rows, 'remote' => rows with objects on a remote engine]
     */
    protected function getSystemStorageItems()
    {
        $aGroups = [
            'files' => ['objects' => ['sys_files'], 'counted' => ['sys_files'], 'label' => _t('_adm_dbd_txt_su_files'), 'icon' => 'file', 'url' => BX_DOL_URL_STUDIO . 'storages.php?page=files'],
            'images' => ['objects' => ['sys_images', 'sys_images_resized'], 'counted' => ['sys_images'], 'label' => _t('_adm_dbd_txt_su_images'), 'icon' => 'image', 'url' => BX_DOL_URL_STUDIO . 'storages.php?page=images'],
            'media' => ['objects' => [], 'counted' => [], 'label' => _t('_adm_dbd_txt_su_system_media'), 'icon' => 'hard-drive', 'url' => BX_DOL_URL_STUDIO . 'storages.php'],
        ];

        $aTotals = [];
        foreach($aGroups as $sGroup => $aGroup)
            $aTotals[$sGroup] = ['local' => ['size' => 0, 'files' => 0, 'objects' => 0], 'remote' => ['size' => 0, 'files' => 0, 'objects' => 0]];

        foreach($this->oDb->getStorageObjects('sys') as $aObject) {
            $sGroup = 'media';
            foreach($aGroups as $sName => $aGroup)
                if(in_array($aObject['object'], $aGroup['objects'])) {
                    $sGroup = $sName;
                    break;
                }

            $sScope = $aObject['engine'] == 'Local' ? 'local' : 'remote';
            $aTotals[$sGroup][$sScope]['size'] += (int)$aObject['current_size'];
            $aTotals[$sGroup][$sScope]['objects']++;
            if(in_array($aObject['object'], $aGroups[$sGroup]['counted']))
                $aTotals[$sGroup][$sScope]['files'] += (int)$aObject['current_number'];
        }

        $aResult = ['local' => [], 'remote' => []];
        foreach($aGroups as $sGroup => $aGroup)
            foreach(['local', 'remote'] as $sScope) {
                $aTotal = $aTotals[$sGroup][$sScope];
                if($sScope == 'remote' && $aTotal['objects'] == 0)
                    continue;

                $aResult[$sScope][] = [
                    'label' => $aGroup['label'],
                    'value' => $aTotal['size'],
                    'icon' => $this->getChartIcon($aGroup['icon']),
                    'url' => $aGroup['url'],
                    'note' => !empty($aGroup['counted']) ? _t($aTotal['files'] == 1 ? '_adm_dbd_txt_su_file_count_1' : '_adm_dbd_txt_su_files_count', $aTotal['files']) : ''
                ];
            }

        return $aResult;
    }

    /**
     * Users: a chart in the hero and the rows under it as its legend. The period tabs in the block caption (dbd_users_tabs.html, Total first
     * and selected) pick the time axis: the last 7 days, 30 days or year as a bar per day or month, or Total as the running total over all
     * time (a point per month, or per year once that spans more than two years). The rows pick the series: Accounts (added; first and selected),
     * Active users (last seen), a row per profile type (its profiles added, from the app's content table) and a row per permission level a
     * profile can hold (its current members by when they joined it; the pseudo levels are not rows), each showing its figure for the
     * chosen period; the hero shows the charted one's figure and title on the left and, on the right, how many of it are online now (a session
     * within the online window: every online account is an active user, a profile type's are those whose account is online). dashboard.js
     * (initUsersChart) draws from the data of every series over every axis, which all come with the block.
     */
    public function serviceGetBlockUsers()
    {
        $sJsObject = $this->getPageJsObject();
        $iNow = time();

        // the axes: all time first (the default tab), a point per month since the first account, per year once that spans more than two years
        $iFirst = $this->oDb->getAccountsFirstAdded();
        $iYears = $iFirst > 0 ? (int)date('Y', $iNow) - (int)date('Y', $iFirst) + 1 : 1;
        $iMonths = $iFirst > 0 ? ($iYears - 1) * 12 + (int)date('n', $iNow) - (int)date('n', $iFirst) + 1 : 1;

        $aAxes = [
            'all' => $iMonths > 24 ? ['year', $iYears, 'Y', 'Y'] : ['month', max($iMonths, 1), 'M', 'M Y'],
            '7d' => ['day', 7, 'D', 'j M Y'],
            '30d' => ['day', 30, 'j', 'j M Y'],
            '1y' => ['month', 12, 'M', 'M Y'],
        ];

        $aPeriods = $aTmplVarsPeriods = [];
        foreach($aAxes as $sPeriod => $aAxis) {
            $aPeriods[$sPeriod] = [
                'title' => _t('_adm_dbd_txt_us_' . $sPeriod),
                'label' => _t('_adm_dbd_txt_us_' . $sPeriod . '_label'),
                'type' => $sPeriod == 'all' ? 'line' : 'bars' // the Total tab charts the running total of the buckets instead of the buckets
            ];
            $aTmplVarsPeriods[] = [
                'js_object' => $sJsObject,
                'name' => $sPeriod,
                'title' => $aPeriods[$sPeriod]['title'],
                'selected' => $sPeriod == 'all' ? 'true' : 'false',
                'tabindex' => $sPeriod == 'all' ? '0' : '-1'
            ];
        }

        // the series and where each is counted from
        $oDb = $this->oDb;
        $iOnline = $this->oDb->getAccountsOnlineCount();
        $aSeries = [
            'accounts' => ['title' => _t('_adm_dbd_txt_us_accounts'), 'online' => $iOnline],
            'active' => ['title' => _t('_adm_dbd_txt_us_active'), 'online' => $iOnline],
        ];
        $aSources = [
            'accounts' => function($sFormat, $iSince) use($oDb) { return $oDb->getAccountsAddedBy($sFormat, $iSince); },
            'active' => function($sFormat, $iSince) use($oDb) { return $oDb->getAccountsSeenBy($sFormat, $iSince); },
        ];

        // one row per enabled profile app (the modules flagged with the profile subtype), at zero too, with its pending profiles as a note;
        // its series counts the app's content table by its added field, so an app without one gets a row that charts nothing
        $aCounts = [];
        foreach($this->oDb->getProfilesByType() as $aRow)
            $aCounts[$aRow['type']] = $aRow;

        $aTmplVarsProfiles = [];
        foreach(BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules_subtypes', 'value' => BX_DOL_MODULE_SUBTYPE_PROFILE]) as $aModule) {
            if(empty($aModule['enabled']))
                continue;

            $sSeries = '';
            $oModule = BxDolModule::getInstance($aModule['name']);
            $aCnf = $oModule && !empty($oModule->_oConfig->CNF) ? $oModule->_oConfig->CNF : [];
            if(!empty($aCnf['TABLE_ENTRIES']) && !empty($aCnf['FIELD_ADDED'])) {
                $sSeries = 'profiles_' . $aModule['name'];
                $sTable = $aCnf['TABLE_ENTRIES'];
                $sField = $aCnf['FIELD_ADDED'];
                $aSeries[$sSeries] = ['title' => $aModule['title'], 'online' => $this->oDb->getProfilesOnlineCount($aModule['name'])];
                $aSources[$sSeries] = function($sFormat, $iSince) use($oDb, $sTable, $sField) { return $oDb->getEntriesAddedBy($sTable, $sField, $sFormat, $iSince); };
            }

            $aRow = $aCounts[$aModule['name']] ?? ['total' => 0, 'active' => 0];
            $iPending = (int)$aRow['total'] - (int)$aRow['active'];
            $aTmplVarsProfiles[] = [
                'js_object' => $sJsObject,
                'series' => $sSeries,
                'icon_url' => BxDolStudioUtils::getModuleIcon($aModule),
                'name' => $aModule['title'],
                'bx_if:show_note' => ['condition' => $iPending > 0, 'content' => ['note' => _t('_adm_dbd_txt_us_pending', $iPending)]],
                'value' => number_format((int)$aRow['total'])
            ];
        }

        // one row per permission level a profile can hold (BxDolStudioDashboardQuery::getLevels), with its current members; its series is when
        // they joined it, and its icon the level's own (a Lucide name), the shield when that is missing
        $aLevelCounts = $this->oDb->getLevelsMembersCount();
        $aTmplVarsLevels = [];
        foreach($this->oDb->getLevels() as $aLevel) {
            $iLevel = (int)$aLevel['ID'];
            $sSeries = 'level_' . $iLevel;
            $sTitle = _t($aLevel['Name']);
            $aSeries[$sSeries] = ['title' => $sTitle, 'online' => $this->oDb->getLevelOnlineCount($iLevel)];
            $aSources[$sSeries] = function($sFormat, $iSince) use($oDb, $iLevel) { return $oDb->getLevelMembersSinceBy($iLevel, $sFormat, $iSince); };

            $sIcon = !empty($aLevel['Icon']) ? $this->getChartIcon($aLevel['Icon'])['svg'] : '';
            $aTmplVarsLevels[] = [
                'js_object' => $sJsObject,
                'series' => $sSeries,
                'icon' => $sIcon ?: $this->getChartIcon('shield')['svg'],
                'name' => $sTitle,
                'value' => number_format((int)($aLevelCounts[$iLevel] ?? 0))
            ];
        }

        // every series over every axis; the Total axis carries the running total
        foreach($aSeries as $sSeries => &$aOne) {
            $aOne['periods'] = [];
            foreach($aAxes as $sPeriod => $aAxis) {
                $aItems = $this->getUsersChartBuckets($aAxis[0], $aAxis[1], $aAxis[2], $aAxis[3], $aSources[$sSeries]);
                if($sPeriod == 'all') {
                    $iRunning = 0;
                    foreach($aItems as &$aItem) {
                        $iRunning += $aItem['count'];
                        $aItem['total'] = $iRunning;
                    }
                    unset($aItem);
                }

                $aOne['periods'][$sPeriod] = $aItems;
            }
        }
        unset($aOne);

        $sContent = BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_users.html', [
            'js_object' => $sJsObject,
            'icon_accounts' => $this->getChartIcon('at-sign')['svg'],
            'icon_active' => $this->getChartIcon('users')['svg'],
            'accounts' => number_format($this->oDb->getAccountsCount()),
            'active' => number_format(array_sum(array_column($aSeries['active']['periods']['all'], 'count'))), // dashboard.js keeps every row's figure on the chosen period
            'bx_if:show_profiles' => ['condition' => !empty($aTmplVarsProfiles), 'content' => ['bx_repeat:profiles' => $aTmplVarsProfiles]],
            'bx_if:show_levels' => ['condition' => !empty($aTmplVarsLevels), 'content' => ['bx_repeat:levels' => $aTmplVarsLevels]],
            'chart_data' => json_encode([
                'period' => 'all',
                'series_default' => 'accounts',
                'periods' => $aPeriods,
                'series' => $aSeries,
                'txt_peak' => _t('_adm_dbd_txt_us_peak', '{0}') // the chart's accessible name names the peak bucket's count
            ])
        ]);

        // the period switcher sits in the block caption, like the Server block's tabs
        return [
            'content' => $sContent,
            'menu' => BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_users_tabs.html', ['js_object' => $sJsObject, 'bx_repeat:periods' => $aTmplVarsPeriods])
        ];
    }

    /**
     * A series' buckets over an axis: the last $iCount days, months or years up to now, each with the short label under its bar, its full
     * name for the tooltip and what $fCounts (a MySQL date format and the axis start, giving bucket => count) counted in it.
     */
    protected function getUsersChartBuckets($sUnit, $iCount, $sLabel, $sTitle, $fCounts)
    {
        $aFormats = ['day' => ['%Y-%m-%d', 'Y-m-d'], 'month' => ['%Y-%m', 'Y-m'], 'year' => ['%Y', 'Y']];
        list($sSqlFormat, $sPhpFormat) = $aFormats[$sUnit];

        $iNow = time();
        $aBuckets = [];
        for($i = $iCount - 1; $i >= 0; $i--) {
            switch($sUnit) {
                case 'month':
                    $iTime = strtotime(date('Y-m-01', $iNow) . ' -' . $i . ' months');
                    break;
                case 'year':
                    $iTime = mktime(0, 0, 0, 1, 1, (int)date('Y', $iNow) - $i);
                    break;
                default:
                    $iTime = strtotime(date('Y-m-d', $iNow) . ' -' . $i . ' days');
            }

            $aBuckets[date($sPhpFormat, $iTime)] = ['label' => date($sLabel, $iTime), 'title' => date($sTitle, $iTime), 'count' => 0];
        }

        $sFirst = array_key_first($aBuckets);
        $iSince = $sUnit == 'day' ? strtotime($sFirst . ' 00:00:00') : ($sUnit == 'month' ? strtotime($sFirst . '-01 00:00:00') : mktime(0, 0, 0, 1, 1, (int)$sFirst));
        foreach($fCounts($sSqlFormat, $iSince) as $sBucket => $iAdded)
            if(isset($aBuckets[$sBucket]))
                $aBuckets[$sBucket]['count'] = (int)$iAdded;

        return array_values($aBuckets);
    }

    public function serviceGetBlockSpace($bDynamic = false)
    {
    	$bInclideScriptSpace = false; //Use dynamic loading by default if this setting is enabled.

    	$sJsObject = $this->getPageJsObject();

    	$aChartData = array();
    	if(!$bDynamic) {
            // Two charts and two lists: what lives on this server (the database, the Storage app's files and images, the rest of the system's
            // media, then every installed module's local storage, at zero too) and what lives on remote storage (whichever of those have
            // objects on a remote engine); when no remote storage is in use the second chart and list are a "not connected" placeholder.
            // Rows link to the page that manages them; the Storage app's rows also count their files.
	    	$aLocal = array(
	    		array('label' => _t('_adm_dbd_txt_su_database'), 'value' => $this->getDbSize(), 'icon' => $this->getChartIcon('database')),
	    	);
            $aRemote = array();

	    	if($bInclideScriptSpace) {
	    		$iSizeDiskTotal = $this->getFolderSize(BX_DIRECTORY_PATH_ROOT);
	    		$iSizeDiskMedia = $this->getFolderSize(BX_DIRECTORY_STORAGE);
	    	
	    		$aLocal[] = array('label' => _t('_adm_dbd_txt_su_system'), 'value' => $iSizeDiskTotal - $iSizeDiskMedia, 'icon' => $this->getChartIcon('hard-drive'));
	    	}

            $aSystem = $this->getSystemStorageItems();
            $aLocal = array_merge($aLocal, $aSystem['local']);
            $aRemote = array_merge($aRemote, $aSystem['remote']);

	    	$aModules = BxDolModuleQuery::getInstance()->getModulesBy(array('type' => 'all'));
	    	foreach($aModules as $aModule) {
                if($aModule['name'] == 'system')
                    continue;

                $aIcon = $this->getChartIcon(BxDolStudioUtils::getModuleIcon($aModule), true);
                $sUrl = BX_DOL_URL_STUDIO . 'module.php?name=' . $aModule['name'];

                $aSizes = $this->oDb->getModuleStorageSizes($aModule['name']);
				$aLocal[] = array('label' => $aModule['title'], 'value' => $aSizes['local']['size'], 'icon' => $aIcon, 'url' => $sUrl);
                if($aSizes['remote']['objects'] > 0)
                    $aRemote[] = array('label' => $aModule['title'], 'value' => $aSizes['remote']['size'], 'icon' => $aIcon, 'url' => $sUrl);
	    	}

            $fDiskTotal = @disk_total_space(BX_DIRECTORY_PATH_ROOT);
            $aChartLocal = $this->getChartData($this->getChartItems($aLocal), array_sum(array_column($aLocal, 'value')), $fDiskTotal !== false ? (float)$fDiskTotal : 0);
            $aChartLocal['label'] = bx_process_output(_t('_adm_dbd_txt_su_local'));

            $sRemote = bx_process_output(_t('_adm_dbd_txt_su_remote'));
            if($this->oDb->isRemoteStorageUsed()) {
                $aChartRemote = $this->getChartData($this->getChartItems($aRemote), array_sum(array_column($aRemote, 'value')));
                $aChartRemote['label'] = $sRemote;
                $aRowsRemote = $aChartRemote['items'];
            }
            else {
                $sOff = bx_process_output(_t('_adm_dbd_txt_su_remote_off'));
                $aChartRemote = array('label' => $sRemote, 'items' => array(), 'used' => $sOff, 'total' => '', 'used_bytes' => 0, 'total_bytes' => 0);
                $aRowsRemote = array(array('name' => $sRemote, 'bytes' => 0, 'size' => $sOff, 'icon' => $this->getChartIcon('cloud-off'), 'placeholder' => true));
            }

            $aChartData = array(
                'charts' => array($aChartLocal, $aChartRemote),
                'groups' => array(array('items' => $aChartLocal['items']), array('items' => $aRowsRemote)),
            );
    	}

        $sContent = BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_space.html', array(
        	'bx_if:show_content' => array(
        		'condition' => !$bDynamic,
        		'content' => array(
		        	'js_object' => $sJsObject,
		        	'chart_data' => $this->getChartJson($aChartData)
       			)
       		),
       		'bx_if:show_loader' => array(
       			'condition' => $bDynamic,
       			'content' => array(
       				'js_object' => $sJsObject,
       			)
       		)
        ));

        return array('content' => $sContent);
    }

    public function serviceGetBlockHostTools($bDynamic = false)
    {
        $sJsObject = $this->getPageJsObject();

        $oTemplate = BxDolStudioTemplate::getInstance();

        // the links in the audit report (?action=audit_send_test_email / phpinfo) come back to this page: answered before anything is rendered
        (new BxDolStudioToolsAudit())->processRequest();

        $aTmplVarsGauges = $aTmplVarsItems = [];
        if($bDynamic) {
            // Overview gauges: a donut per metric, its arc a share of the ring's circumference (2 * pi * 40); the ring shows the
            // metric's figure with its unit, when it has one, small underneath.
            $fRing = 251.327;
            foreach($this->getServerMetrics() as $sMetric => $aMetric) {
                $sNa = _t('_adm_dbd_txt_ht_na');
                $aTmplVarsGauges[] = [
                    'name' => $sMetric,
                    'class_add' => $aMetric !== null && $aMetric['percent'] >= 90 ? ' bx-dbd-gauge-high' : '',
                    'title' => _t('_adm_dbd_txt_ht_' . $sMetric),
                    'value' => $aMetric !== null ? $aMetric['value'] : $sNa,
                    'label' => $aMetric !== null ? trim($aMetric['value'] . ' ' . $aMetric['unit']) . ($aMetric['percent'] >= 90 ? ', ' . _t('_adm_dbd_txt_ht_high') : '') : $sNa, // the red arc alone would not tell a screen reader
                    'bx_if:show_unit' => [
                        'condition' => $aMetric !== null && $aMetric['unit'] !== '',
                        'content' => ['unit' => $aMetric !== null ? $aMetric['unit'] : '']
                    ],
                    'dash' => $aMetric !== null ? round($aMetric['percent'] / 100 * $fRing, 2) : 0,
                    'ring' => $fRing
                ];
            }

            // Status rows: a row per section of the last audit with its headline (a version) or its outcome, and the issue count when it has issues.
            foreach($this->getAuditReport()['sections'] as $aSection) {
                $aSummary = $this->getAuditSectionSummary($aSection);
                $aTmplVarsItems[] = [
                    'status' => $aSummary['status'],
                    'status_title' => _t('_sys_audit_title_' . $aSummary['status']), // read out in place of the dot's colour
                    'icon' => $this->getChartIcon($aSection['icon'])['svg'],
                    'title' => $aSection['title'],
                    'value' => $aSummary['value'],
                    'bx_if:show_desc' => [
                        'condition' => $aSummary['desc'] !== '',
                        'content' => ['desc' => $aSummary['desc']]
                    ]
                ];
            }
        }

        $sContent = $oTemplate->parseHtmlByName('dbd_htools.html', [
            'js_object' => $sJsObject,
            'bx_if:show_content' => [
                'condition' => $bDynamic,
                'content' => [
                    'bx_repeat:gauges' => $aTmplVarsGauges,
                    'bx_repeat:items' => $aTmplVarsItems,
                ]
            ],
            'bx_if:show_loader' => [
                'condition' => !$bDynamic,
                'content' => [
                    'js_object' => $sJsObject,
                ]
            ]
        ]);

        if($bDynamic)
            return ['content' => $sContent];

        // The tab switcher sits in the block caption; the panels it drives arrive with the Overview.
        return [
            'content' => $sContent,
            'menu' => $oTemplate->parseHtmlByName('dbd_htools_tabs.html', ['js_object' => $sJsObject])
        ];
    }

    /**
     * Server block, Audit tab: a hero with when the last audit ran, a bar of its outcomes and the button to run a new one,
     * then the sections as an accordion of status rows, and the note on what needs a person.
     */
    public function getBlockHostToolsAudit()
    {
        $oAudit = new BxDolStudioToolsAudit();
        $aReport = $this->getAuditReport();
        $sJsObject = $this->getPageJsObject();
        $sChevron = $this->getChartIcon('chevron-down')['svg'];

        $aTotals = ['ok' => 0, 'warn' => 0, 'fail' => 0, 'undef' => 0];
        $aTmplVarsSections = [];
        foreach($aReport['sections'] as $aSection) {
            $aSummary = $this->getAuditSectionSummary($aSection);
            foreach($aSummary['counts'] as $sType => $iCount)
                $aTotals[$sType] += $iCount;

            $aTmplVarsRows = [];
            foreach($aSection['rows'] as $aRow)
                $aTmplVarsRows[] = $this->getHostToolsRowVars($aRow, $oAudit);

            $aTmplVarsSections[] = [
                'js_object' => $sJsObject,
                'name' => $aSection['name'],
                'status' => $aSummary['status'],
                'icon' => $this->getChartIcon($aSection['icon'])['svg'],
                'icon_chevron' => $sChevron,
                'title' => $aSection['title'],
                'value' => $aSummary['value'],
                'bx_repeat:rows' => $aTmplVarsRows
            ];
        }

        // The bar: a segment per outcome, passed first; the same counts are written out under the button.
        $iTotal = max(1, array_sum($aTotals));
        $aTmplVarsSegments = $aSummary = [];
        foreach(['ok' => '_adm_dbd_txt_ht_passed', 'warn' => '_adm_dbd_txt_ht_warnings', 'fail' => '_adm_dbd_txt_ht_failed', 'undef' => '_adm_dbd_txt_ht_unknown'] as $sType => $sKey) {
            if($aTotals[$sType] == 0)
                continue;

            $sLabel = _t($sType == 'warn' && $aTotals[$sType] == 1 ? '_adm_dbd_txt_ht_warning' : $sKey, $aTotals[$sType]);
            $aTmplVarsSegments[] = ['type' => $sType, 'share' => round($aTotals[$sType] / $iTotal * 100, 2), 'label' => bx_html_attribute($sLabel)];
            $aSummary[] = $sLabel;
        }

        ob_start();
        $oAudit->generateJs();
        $sJs = ob_get_clean();

        return $sJs . BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_htools_audit.html', [
            'js_object' => $sJsObject,
            'time' => bx_time_js($aReport['time'], BX_FORMAT_DATE_TIME),
            'bar_label' => bx_html_attribute(implode(', ', $aSummary)),
            'bx_repeat:segments' => $aTmplVarsSegments,
            'summary' => implode(' &middot; ', $aSummary),
            'bx_repeat:sections' => $aTmplVarsSections
        ]);
    }

    /**
     * A section's outcome for the Status tab and the audit accordion: its worst row status (unknown rows only count when
     * there is nothing else), its headline (a version) or its outcome as the value, and, under a headline that stands for
     * several rows, the issue count as the note.
     * @return array status ('ok', 'warn', 'fail', 'undef'), value, desc, counts (rows per status)
     */
    protected function getAuditSectionSummary($aSection)
    {
        $aCounts = ['ok' => 0, 'warn' => 0, 'fail' => 0, 'undef' => 0];
        foreach($aSection['rows'] as $aRow)
            if(isset($aCounts[$aRow['type']]))
                $aCounts[$aRow['type']]++;

        $sStatus = 'undef';
        foreach(['fail', 'warn', 'ok'] as $sType)
            if($aCounts[$sType] > 0) {
                $sStatus = $sType;
                break;
            }

        $aIssues = [];
        if($aCounts['fail'] > 0)
            $aIssues[] = _t('_adm_dbd_txt_ht_failed', $aCounts['fail']);
        if($aCounts['warn'] > 0)
            $aIssues[] = _t($aCounts['warn'] == 1 ? '_adm_dbd_txt_ht_warning' : '_adm_dbd_txt_ht_warnings', $aCounts['warn']);
        $sIssues = implode(', ', $aIssues);

        $bHeadline = $aSection['value'] !== '';
        return [
            'status' => $sStatus,
            'value' => $bHeadline ? $aSection['value'] : ($sIssues !== '' ? $sIssues : _t($sStatus == 'ok' ? '_sys_audit_title_ok' : '_sys_audit_title_undef')),
            'desc' => $bHeadline && count($aSection['rows']) > 1 ? $sIssues : '',
            'counts' => $aCounts
        ];
    }

    /**
     * One audit row as status-row template variables; a row without a value shows its status word instead.
     */
    protected function getHostToolsRowVars($aRow, $oAudit)
    {
        return [
            'status' => $aRow['type'],
            'title' => $aRow['name'],
            'value' => $aRow['value'] !== '' ? $aRow['value'] : $oAudit->typeToTitle($aRow['type']),
            'bx_if:show_desc' => [
                'condition' => $aRow['msg'] !== '',
                'content' => ['desc' => $aRow['msg']]
            ]
        ];
    }

    public function serviceGetBlockCache()
    {
        $sJsObject = $this->getPageJsObject();

        $sChartData = $this->getCacheChartData();
        $bChartData = $sChartData !== false;

        $sContent = BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_cache.html', [
            'bx_if:show_chart' => [
                'condition' => $bChartData,
                'content' => [
                    'js_object' => $sJsObject,
                    'chart_data' => $sChartData,
                ]
            ],
            'bx_if:show_empty' => [
                'condition' => !$bChartData,
                'content' => [
                    'message' => MsgBox(_t('_adm_dbd_msg_c_all_disabled'))
                ]
            ],
        ]);

        return ['content' => $sContent];
    }

    public function serviceGetBlockQueues()
    {
        $sChartData = $this->getQueuesChartData();
        if($sChartData === false)
            return ['content' => ''];

        // "Clear all queues" is the hero's button (chart data), each row that can be emptied carries its own clear button.
        return ['content' => BxDolStudioTemplate::getInstance()->parseHtmlByName('dbd_queues.html', [
            'js_object' => $this->getPageJsObject(),
            'chart_data' => $sChartData,
        ])];
    }

    /**
     * @return array [latest version on the channel or '' when the check failed, whether it is newer than the installed one, whether an upgrade patch can be run]
     */
    private function getVersionChannelInfo($sChannel)
    {
        $oUpgrader = bx_instance('BxDolUpgrader'); 
        $aUpdateInfo = $oUpgrader->getVersionUpdateInfo($sChannel);
        if(!is_array($aUpdateInfo) || empty($aUpdateInfo['latest_version']))
            return ['', false, false];

        return [$aUpdateInfo['latest_version'], $oUpgrader->isNewVersionAvailable($aUpdateInfo), $oUpgrader->isUpgradeAvailable($aUpdateInfo)];
    }
}

/** @} */
