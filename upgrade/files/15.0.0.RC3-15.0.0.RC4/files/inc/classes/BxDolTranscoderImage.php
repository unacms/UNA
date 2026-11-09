<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * This class transcodes images on the fly.
 * Transcoded image is saved in the specified storage engine and next time ready image is served.
 *
 *
 * To add image transcoder object add record to 'sys_objects_transcoder' table:
 * - object - name of the transcoder object, in the format: vendor prefix, underscore, module prefix, underscore, image size name; for example: bx_images_thumb.
 * - storage_object - name of the storage object to store transcoded data, the specified storage object need to be created too, @see BxDolStorage.
 * - source_type - type of the source, where is source image is taken from, available options 'Storage' and 'Folder' for now.
 * - source_params - source_type params, each source_type can have own set of params, please read futher for more info about particular source_types, serialized array of params is stored here.
 * - private - how to store transcoded data:
 *      - no - store transcoded data publicly.
 *      - yes - store transcoded data privately.
 *      - auto - detect automatically, not supported for 'Folder' source type.
 * - atime_tracking - track last access time to the transcoded data, allowed values 0 - disables or 1 - enabled.
 * - atime_pruning - prune transcoded images by last access time, if last access time of the image is older than atime_pruning seconds - it is deleted, it works when atime_tracking is enabled
 * - ts - unix timestamp of the last change of transcoder parameters, if transcoded image is older than this value - image is deleted and transcoded again.
 *
 *
 * Then you need to add image filters to 'sys_transcoder_filters' table:
 * - transcoder_object - name of the transcoded object to apply filter to.
 * - filter - filter name, please read futher for available filters.
 * - filter_params - serialized array of filter params, please read futher for particular filters params.
 * - order - if there are several filters for one object, they will be applied in this order.
 *
 *
 * 'Folder' source types:
 * This source type is some folder with original images for the transcoding, the identifier of the image (handler) is file name.
 * The params are the following:
 * - path - path to the folder with original images
 * This source type has some limitation:
 * - automatic detection of private files is not supported
 * - transcoded file is not automaticlaly deleted/renewed if original file is changed
 *
 *
 * 'Storage' source type:
 * The source of original files is Storage engine, the identifier of the image (handler) is file id.
 * The params are the following:
 * - object - name of the Storage object
 *
 *
 * Available filters:
 * - Resize - this filter resizes original image, the parameters are the following:
 *     - w - width of resulted image.
 *     - h - height of resulted image.
 *     - square_resize - make resulted image square, even of original image is not square, 'w' and 'h' parameters must be the same.
 *     - crop_resize - crop image to destination size with filling whole area of destination size.
 *     - force_type - always change type of the image to the specified type: jpg, png, gif.
 * - Grayscale - make image grayscale, there is no parameters for this filter
 *
 *
 * Automatic deletetion of associated data is supported - in the case if original or transcoded file is deleted,
 * but you need to register alert handlers, just call registerHandlers () function to register handler (for example, during module installation)
 * and call unregisterHandlers () function to unregister handlers (for example, during module uninstallation)
 *
 *
 * Example of usage:
 * @code
 * $oTranscoder = BxDolTranscoderImage::getObjectInstance('bx_images_thumb'); // change images transcode object name to your own
 * $oTranscoder->registerHandlers(); // make sure to call it only once! before the first usage, no need to call it every time
 * $sTranscodedImageUrl = $oTranscoder->getFileUrl('my_dog.jpg'); // the name of file, in the case of 'Folder' storage type this is file name
 * echo 'My dog : <img src="' . $sUrl . '" />'; // transcoded(resized and/or grayscaled) image will be shown, according to the specified filters
 * @endcode
 *
 */
class BxDolTranscoderImage extends BxDolTranscoder implements iBxDolFactoryObject
{
    protected function __construct($aObject, $oStorage)
    {
        parent::__construct($aObject, $oStorage);
        $this->_oDb = new BxDolTranscoderImageQuery($aObject, false);
        $this->_sQueueTable = $this->_oDb->getQueueTable();
    }
    
    public static function getObjectAbstract()
    {
        if (isset($GLOBALS['bxDolClasses'][__CLASS__ . '!Abstract']))
            return $GLOBALS['bxDolClasses'][__CLASS__ . '!Abstract'];

        $aObject = array('object' => 'abstract');
        $o = new BxDolTranscoderImage ($aObject, null);
        return ($GLOBALS['bxDolClasses'][__CLASS__ . '!Abstract'] = $o);
    }
    
    /**
     * check if transcoder suppors given file mime type
     */ 
    public function isMimeTypeSupported($sMimeType)
    {
        $sMimeType = strtolower($sMimeType);
        switch ($sMimeType) {
            case 'image/gif':
            case 'image/jpeg':
            case 'image/pjpeg':
            case 'image/png':
            case 'image/webp':
                return true;
        }

        return false;
    }

    public function isMimeTypeSvg($sMimeType)
    {
        return $this->_oStorage->isMimeTypeSvg($sMimeType);
    }

    /**
     * Get transcoded file url.
     * If transcoded file is ready then direct url to the file is returned.
     * If there is no transcoded data available, then special url is returned, upon opening this url image is transcoded automatically and redirects to the ready transcoed image.
     * @param $mixedHandler - file handler
     * @return file url, or false on error.
     */
    public function getFileUrl($mixedHandler)
    {
        $sFileUrl = $this->getOrigFileUrl($mixedHandler);

        // API gets the original image, SVG or not, as BxDolTranscoder::getFileUrl gives it, so don't read the file twice
        if(bx_is_api())
            return $sFileUrl;

        if($sFileUrl !== false) {
            $sFileMimeType = $this->_oStorage->getMimeTypeByFileName($sFileUrl);
            if($this->isMimeTypeSvg($sFileMimeType))
                return $sFileUrl;
        }

        return parent::getFileUrl($mixedHandler);
    }

    public function getFileMimeType($mixedHandler)
    {
        return $this->_oStorage->getMimeTypeByFileName($this->getFileUrl($mixedHandler));
    }

    /**
     * Get file url when file isn't transcoded yet
     */
    public function getFileUrlNotReady($mixedHandler)
    {
        return BX_DOL_URL_ROOT . 'image_transcoder.php?o=' . $this->_aObject['object'] . '&h=' . $mixedHandler . '&dpx=' . $this->getDevicePixelRatio() . '&t=' . time() . '&s=' . $this->getHandlerSignature($mixedHandler);
    }

    public function isFileReady ($mixedHandlerOrig, $isCheckOutdated = true)
    {
        if (isAdmin() && false !== $this->getFilterParams('ResizeVar')) { // only operators can apply new image size
            $mixedHandler = $this->processHandlerForRetinaDevice($mixedHandlerOrig); 
            $aTranscodedFileData = $this->_oDb->getTranscodedFileData ($mixedHandler);
            $x = $this->getCustomResizeDimension ('x');
            $y = $this->getCustomResizeDimension ('y');

            // if new sizes are provided - delete old image, so new one will be created
            if (($x && (!isset($aTranscodedFileData['x']) || $x != $aTranscodedFileData['x'])) || ($y && (!isset($aTranscodedFileData['y']) || $y != $aTranscodedFileData['y']))) {                
                if (!($iFileId = $this->_oDb->getFileIdByHandler($mixedHandler)))
                    return false;

                if (!($aFile = $this->_oStorage->getFile($iFileId)))
                    return false;

                if (!$this->_oStorage->deleteFile($aFile['id']))
                    return false;
            }
        }
        return parent::isFileReady ($mixedHandlerOrig, $isCheckOutdated);
    }
    
    public function getSize ($sFile)
    {
        $oImage = BxDolImageResize::getInstance();
        $aSize = $oImage->getImageSize($sFile);

        return $aSize;
    }

    protected function getCustomResizeDimension ($sName)
    {
        $i = (int)bx_get($sName);
        if ($i > 2048) $i = 2048;
        if ($i && $i < 16) $i = 16;
        return $i;
    }

    public function transcode ($mixedHandler, $iProfileId = 0)
    {
        if (!($bRet = parent::transcode ($mixedHandler, $iProfileId)))
            return $bRet;

        $x = $this->getCustomResizeDimension ('x');
        $y = $this->getCustomResizeDimension ('y');
        if ($x || $y) {
            $mixedHandler = $this->processHandlerForRetinaDevice($mixedHandler);
            $this->_oDb->updateTranscodedFileData($mixedHandler, array('x' => $x, 'y' => $y));
        }

        return $bRet;
    }

    protected function applyFilter_Grayscale ($sFile, $aParams)
    {
        $o = BxDolImageResize::getInstance();
        $o->removeCropOptions ();

        if (IMAGE_ERROR_SUCCESS == $o->grayscale($sFile))
            return true;

        bx_log('sys_transcoder', "[{$this->_aObject['object']}] ERROR: applyFilter_Grayscale failed for file ({$sFile}): " . $o->getError(), BX_LOG_ERR);

        return false;
    }

    protected function applyFilter_ResizeVar ($sFile, $aParams)
    {
        $aParams['w'] = $this->getCustomResizeDimension ('x');
        $aParams['h'] = $this->getCustomResizeDimension ('y');

        if(!$aParams['w'])
            unset($aParams['w']);
        if(!$aParams['h'])
            unset($aParams['h']);

        if(!isset($aParams['w']) && !isset($aParams['h']))
            return true;

        return $this->applyFilter_Resize ($sFile, $aParams);
    }
}

/** @} */
