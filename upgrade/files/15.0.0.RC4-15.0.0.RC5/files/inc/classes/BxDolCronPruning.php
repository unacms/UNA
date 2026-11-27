<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolCronPruning extends BxDolCron
{
    protected function start()
    {
        set_time_limit(0);
        ignore_user_abort();
        ob_start();
    }

    protected function finish()
    {
        bx_alert('system', 'pruning', 0);

        if(!($sOutput = ob_get_clean()))
            return;

        if(getParam('enable_notification_pruning') != 'on')
            return;

        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate('t_Pruning', array('pruning_output' => $sOutput, 'site_title' => getParam('site_title')), 0, 0);
        if($aTemplate)
            sendMail(getParam('site_email'), $aTemplate['Subject'], $aTemplate['Body'], 0, array(), BX_EMAIL_NOTIFY);
    }

    /**
     * Clean database by deleting some expired data
     */
    protected function cleanDatabase()
    {
        // clean expired membership levels
        $oAcl = BxDolAcl::getInstance();
        $iDeleteMemLevels = $oAcl ? $oAcl->maintenance() : 0;

        // clean sessions
        $oSession = BxDolSession::getInstance();
        $iSessions = $oSession ? $oSession->maintenance() : 0;

        // clean storage engine expired private file tokens
        $iDeletedExpiredTokens = BxDolStorage::pruning();

        // clean outdated transcoded images
        $iDeletedTranscodedImages = BxDolTranscoderImage::pruning();

        // clean view tracks
        $iViewTracks = BxDolView::pruning();
        
        // clean vote tracks
        $iVoteTracks = BxDolVote::pruning();
        
        // clean score tracks
        $iScoreTracks = BxDolScore::pruning();

        // clean favorite tracks
        $iFavoriteTracks = BxDolFavorite::pruning();

        // clean report tracks
        $iReportTracks = BxDolReport::pruning();

        // clean accounts without profiles
        $iDeletedAccounts = BxDolAccount::pruning();

        // clean expired keys
        $oKey = BxDolKey::getInstance();
        $iDeletedKeys = $oKey ? $oKey->prune() : 0;

        // clean expired link embeds and the pictures they have stored
        BxDolEmbed::pruning();

        // clean background jobs
        $iDeletedJobs = BxDolBackgroundJobs::pruning();

        // clean what API v2 keeps (only while it is on)
        $this->cleanApiV2();

        // reset Alert counters
        BxDolAlerts::resetAlertsCounter24h();

        echo call_user_func_array('_t', ['_sys_pruning_db', 
            $iDeleteMemLevels, 
            $iSessions, $iDeletedKeys, 
            $iDeletedExpiredTokens, $iDeletedTranscodedImages, 
            $iDeletedAccounts,
            $iViewTracks, $iVoteTracks, $iScoreTracks, $iFavoriteTracks, $iReportTracks
        ]);
    }

    /**
     * Clean what API v2 keeps: Idempotency-Key answers older than a day and rate limit counts of
     * windows that have passed. Only while API v2 is on: with it off the site prunes what it
     * always did. A failure here (a table a site does not have yet) is logged and never stops the
     * rest of the pruning.
     * @return bool whether it ran
     */
    public function cleanApiV2()
    {
        if(!getParam(BxDolApiV2Router::OPTION_ENABLE))
            return false;

        foreach(['BxDolApiV2Idempotency', 'BxDolApiV2RateLimit'] as $sClass) {
            try {
                $sClass::prune();
            }
            catch(Throwable $e) {
                error_log('UNA pruning: ' . $sClass . ': ' . $e->getMessage());
            }
        }

        return true;
    }

    /**
     * Clean tmp folders (tmp, cache) by deleting old files (by default older than 1 month)
     */
    protected function cleanTmpFolders()
    {
        $aDirsToClean = array(
            array('dir' => BX_DIRECTORY_PATH_TMP, 'prefix' => '', 'file_life_time' => 2592000),
            array('dir' => BX_DIRECTORY_PATH_CACHE, 'prefix' => '', 'file_life_time' => 2592000),
            array('dir' => BX_DIRECTORY_PATH_CACHE_PUBLIC, 'prefix' => '', 'file_life_time' => 3600),
            array('dir' => BX_DIRECTORY_PATH_CACHE_PUBLIC, 'prefix' => parse_url(BX_DOL_URL_ROOT, PHP_URL_HOST) . '_', 'file_life_time' => 86400),
        );

        $iNumTmp = 0;
        $iNumDel = 0;

        foreach ($aDirsToClean as $a) {

            $sDir = $a['dir'];
            $iTmpFileLife = $a['file_life_time'];
            $sPrefix = $a['prefix'];
            $sPrefixLen = strlen($a['prefix']);

            if (!($h = opendir($sDir)))
                continue;

            while ($sFile = readdir($h)) {

                if ('.' == $sFile || '..' == $sFile || '.' == $sFile[0])
                    continue;

                if ($sPrefix && 0 !== strncmp($sFile, $sPrefix, $sPrefixLen))
                    continue;

                ++$iNumTmp;

                $iDiff = time() - filemtime($sDir . $sFile);

                if ($iDiff < $iTmpFileLife)
                    continue;

                if (is_file($sDir . $sFile))
                    @unlink ($sDir . $sFile);
                else
                    @bx_rrmdir($sDir . $sFile);

                ++$iNumDel;
            }

            closedir($h);
        }

        echo _t('_sys_pruning_files', $iNumTmp, $iNumDel);
    }

    public function processing()
    {
        $this->start();

        $this->cleanTmpFolders();

        $this->cleanDatabase();

        $this->finish();
    }
}

/** @} */
