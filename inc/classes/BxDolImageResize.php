<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('IMAGE_ERROR_SUCCESS', 0); ///< operation was successfull
define('IMAGE_ERROR_WRONG_TYPE', 2); ///< operation failed, most probably because incorrect image format(or not image file) was provided

class BxDolImageResize extends BxDolFactory implements iBxDolSingleton
{
    protected $w = 64, $h = 64; ///< size of destination image
    protected $_isAutoCrop = false;
    protected $_iJpegQuality = 90; ///< jpeg quality
    protected $_isSquareResize = false; ///< use smart resize, destination image will be exact Width x Height size
    protected $_isUseGD; ///< use GD library or command line ImagMagic utilites
    protected $_oManager; ///< Intervention Image Manager
    protected $_sError; ///< Intervention Image Manager error string
    protected $_bRemoveTransparency = false; ///< remove transparency from images during resizing
    protected $_sRemoveTransparencyFillColor = '#ffffff'; ///< when removing transparency - fill with this color

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_isUseGD = getParam('enable_gd') == 'on' && extension_loaded('gd') ? true : false;

        $this->_oManager = new Intervention\Image\ImageManager(array('driver' => $this->_isUseGD ? 'gd' : 'imagick'));
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolImageResize();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function getManager ()
    {
        return $this->_oManager;
    }

    function getError ()
    {
        return $this->_sError;
    }

    function isAllowedImage ($sSrcImage)
    {
        try {
            $this->_oManager->make($sSrcImage);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
    }

    function resize ($mixedImage, $sDstImage = '')
    {
        if (is_array($mixedImage)) {
            $aRet = array();
            foreach ($mixedImage as $s) {
                $aRet[] = $this->_resize ($s, $s);
            }
            return $aRet;
        } else {
            return $this->_resize ($mixedImage, $sDstImage);
        }
    }

    function applyWatermark ($mixedImage, $sDstImage, $sWtrImage, $iTransparency, $sPosition = 'bottom-right', $sPositionOffsetX = 0, $sPositionOffsetY = 0, $sScaleFactor = 0.2 )
    {
        if (is_array($mixedImage)) {
            $aRet = array();
            foreach ($mixedImage as $s)
                $aRet[] = $this->_applyWatermark ($s, $s, $sWtrImage, $iTransparency, $sPosition, $sPositionOffsetX, $sPositionOffsetY, $sScaleFactor);
            return $aRet;
        } else {
            return $this->_applyWatermark ($mixedImage, $sDstImage, $sWtrImage, $iTransparency, $sPosition, $sPositionOffsetX, $sPositionOffsetY, $sScaleFactor);
        }
    }

    function grayscale ($mixedImage, $sDstImage = '')
    {
        if (is_array($mixedImage)) {
            $aRet = array();
            foreach ($mixedImage as $s) {
                $aRet[] = $this->_grayscale ($s, $s);
            }
            return $aRet;
        } else {
            return $this->_grayscale ($mixedImage, $sDstImage);
        }
    }

    function setSize ($w, $h)
    {
        $this->w = $w;
        $this->h = $h;
    }

    function removeCropOptions ()
    {
        $this->_isAutoCrop = false;
    }

    /**
     * Crop image to destination size with filling whole area of destination size
     */
    function setAutoCrop ($b)
    {
        $this->_isAutoCrop = $b;
    }

    function setJpegQuality ($i)
    {
        $this->_iJpegQuality = $i;
    }

    public function getJpegQuality ()
    {
        return $this->_iJpegQuality;
    }

    function setSquareResize ($b)
    {
        $this->_isSquareResize = ($b ? true : false);
    }

    function isUsedGD ()
    {
        return $this->_isUseGD;
    }

    static function getImageSize($sPath)
    {
        $o = self::getInstance();
        return $o->_getImageSize($sPath);
    }

    function _getImageSize($sPath)
    {
        $this->_sError = '';
        try {        
            $o = $this->_oManager->make($sPath);
        } 
        catch (Exception $e) {
            $this->_sError = $e->getMessage();
            return false;
        }
        return array ('w' => $o->width(), 'h' => $o->height());
    }

    function getExifInfo($sSrcImage, $bCreateLocalFileIfUrl = true)
    {
        $this->_sError = '';
        $sTmpFileName = false;
        $mixedRet = false;

        if ($bCreateLocalFileIfUrl && preg_match('/^https?:\/\//', $sSrcImage)) {
            $sTmpFileName = tempnam(BX_DIRECTORY_PATH_TMP, '');
            file_put_contents($sTmpFileName, file_get_contents($sSrcImage));
        }

        try {
            $mixedRet = $this->_oManager
                ->make($sTmpFileName ? $sTmpFileName : $sSrcImage)
                ->exif();
        }
        catch (Exception $e) {
            $this->_sError = $e->getMessage();
        }

        if ($sTmpFileName)
            @unlink($sTmpFileName);

        return $mixedRet;
    }

    function getAverageColor($sSrcImage)
    {
        $this->_sError = '';
        try {
            $a = $this->_oManager
                ->make($sSrcImage)
                ->resize(1, 1)
                ->pickColor(0, 0, 'array');

            return array('r' => $a[0], 'g' => $a[1], 'b' => $a[2]);
        }
        catch (Exception $e) {
            $this->_sError = $e->getMessage();
            return false;
        }
    }

    // private functions are below -------------------------------

    function _grayscale ($sSrcImage, $sDstImage = '')
    {
        $this->_sError = '';
        try {
            $this->_oManager
                ->make($sSrcImage)
                ->greyscale()
                ->save($sDstImage ? $sDstImage : $sSrcImage, $this->_iJpegQuality);

            chmod($sDstImage ? $sDstImage : $sSrcImage, BX_DOL_FILE_RIGHTS);
        }
        catch (Exception $e) {
            $this->_sError = $e->getMessage();
            return IMAGE_ERROR_WRONG_TYPE;
        }

        return IMAGE_ERROR_SUCCESS;
    }

    function _removeTransparency ($oImg)
    {
        $oImgBack = $this->_oManager->canvas($oImg->width(), $oImg->height(), $this->_sRemoveTransparencyFillColor);
        return $oImgBack->insert($oImg);
    }

    function _resize ($sSrcImage, $sDstImage = '')
    {       
        $this->_sError = '';
        try {
            if ($this->_isAutoCrop || $this->_isSquareResize) {

                $oImg = $this->_oManager
                    ->make($sSrcImage)
                    ->orientate();

                if ($this->_bRemoveTransparency)
                    $oImg = $this->_removeTransparency($oImg);

                $oImg
                    ->fit($this->w, $this->_isSquareResize ? $this->w : $this->h)
                    ->save($sDstImage ? $sDstImage : $sSrcImage, $this->_iJpegQuality);

            } 
            else {

                $oImg = $this->_oManager
                    ->make($sSrcImage)
                    ->orientate();

                if ($this->_bRemoveTransparency)
                    $oImg = $this->_removeTransparency($oImg);

                $oImg
                    ->resize($this->w, $this->h, function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    })
                    ->save($sDstImage ? $sDstImage : $sSrcImage, $this->_iJpegQuality);
            }
            chmod($sDstImage ? $sDstImage : $sSrcImage, BX_DOL_FILE_RIGHTS);
        }
        catch (Exception $e) {
            $this->_sError = $e->getMessage();
            return IMAGE_ERROR_WRONG_TYPE;
        }

        return IMAGE_ERROR_SUCCESS;
    }

    function _applyWatermark( $sSrcImage, $sDstImage, $sWtrImage, $iTransparency, $sPosition = 'bottom-right', $sPositionOffsetX = 0, $sPositionOffsetY = 0, $sScaleFactor = 0.2)
    {
        $this->_sError = '';
        try {
            $oImageOrig = $this->_oManager->make($sSrcImage);

            $oImageOrig
                ->insert($this->_oManager
                    ->make($sWtrImage)
                    ->resize(round($oImageOrig->width() * $sScaleFactor), round($oImageOrig->height() * $sScaleFactor),  function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    })
                    ->opacity($iTransparency), 
                $sPosition, $sPositionOffsetX, $sPositionOffsetY)
                ->save($sDstImage ? $sDstImage : $sSrcImage, $this->_iJpegQuality);

            chmod($sDstImage ? $sDstImage : $sSrcImage, BX_DOL_FILE_RIGHTS);
        }
        catch (Exception $e) {
            $this->_sError = $e->getMessage();
            return IMAGE_ERROR_WRONG_TYPE;
        }

        return IMAGE_ERROR_SUCCESS;        
    }
}

/** @} */
