<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    OpenCV OpenCV integration
 * @ingroup     UnaModules
 *
 * @{
 */

use CV\Scalar;
use function CV\{imread, imwrite, rectangle, medianBlur, addWeighted};

class BxOpencvModule extends BxDolModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function serviceGetStorages()
    {
        $aStorageObjects = BxDolStorageQuery::getStorageObjects();
        $a = [];
        foreach ($aStorageObjects as $r)
            $a[$r['object']] = $r['object'];
        return $a;
    }

    public function serviceProcessImage($sFilePath, $sExt = 'jpg')
    {
        $sImgSmilePath = BX_DIRECTORY_PATH_MODULES . 'boonex/opencv/template/images/Emojis-01.png';
        $bBlur = 'blur' == getParam('bx_opencv_option_obfuscation_method');
        $src = imread($sFilePath);
        $src2 = null;

        $netDet = CV\FaceDetectorYN::create(BX_DIRECTORY_PATH_MODULES . 'boonex/opencv/models/opencv_zoo/face_detection_yunet_2022mar.onnx', '', $src->size());

        // detect faces
        if ($r = $netDet->detect($src)) {
            // prepare some data
            if ($bBlur) {
                $dst = $src->clone();
                medianBlur($src, $dst, $this->_blurFactor($src->cols));
            }
            else {                
                $src2 = BxDolImageResize::getInstance()->getManager()->make($sFilePath);
            }
        }

        // obfuscate
        $fConfidence = (float)getParam('bx_opencv_option_confidence');
        $faces = [];
        $bDetection = false;
        for ($i = 0; $i < $r->rows; $i++) {
            $confidence = $r->atIdx([$i,14]);

            if ($confidence > $fConfidence) {
                $startX = $r->atIdx([$i,0]);
                $startY = $r->atIdx([$i,1]);
                $w = $r->atIdx([$i,2]);
                $h = $r->atIdx([$i,3]);

                if ($bBlur) {
                    $this->_blur($src, $dst, (int)$startX, (int)$startY, (int)$w, (int)$h);
                }
                else {
                    $img = BxDolImageResize::getInstance()->getManager()->make($sImgSmilePath);
                    $x = (int)(1.3 * max($w, $h));
                    $dx = (int)(($x - max($w, $h)) / 2.0);
                    $img->resize($x, $x);
                    $src2->insert($img, 'top-left', (int)$startX - $dx, (int)$startY - $dx);
                }

                $bDetection = true;
            }
        }

        // save resulted image
        if ($bDetection) {
            if ($bBlur) {
                $sExtReal = pathinfo($sFilePath, PATHINFO_EXTENSION);
                if ($sExtReal) {
                    imwrite($sFilePath, $src);
                }
                else {
                    imwrite($sFilePath . '.' . $sExt, $src);
                    if (file_exists($sFilePath . '.' . $sExt) && unlink($sFilePath))
                        rename($sFilePath . '.' . $sExt, $sFilePath);
                }
            }
            else {
                $src2->save($sFilePath);
            }
        }
    }

    private function _blur(&$src, $dst, $x, $y, $w, $h)
    {
        $iChannels = $src->channels();
        for  ($j = 1; $j < $src->rows - 1; ++$j) {
            for  ($i = 1; $i < $src->cols - 1; ++$i) {
                for  ($ch = 0; $ch < $iChannels; $ch++) {
                    if ($i >= $x && $i <= $x + $w && $j >= $y && $j <= $y + $h) {
                        $val = $dst->at($j, $i, $ch);
                        $src->at($j, $i, $ch, $val);
                    }
                }
            }
        }
    }

    private function _blurFactor($inputValue) {
        // Ensure the input is within a reasonable range
        $inputValue = max(1, $inputValue);

        // Scale the logarithmic value to cover the desired output range
        $scaledValue = log($inputValue/1000) / log(5000);

        // Map the scaled value to the desired output range
        $outputRange = 50 - 19;
        $scaledOutput = round($scaledValue * $outputRange);

        // Adjust the output to be odd
        $outputValue = 19 + ($scaledOutput % 2 === 0 ? 1 : 0) + $scaledOutput;

        return 1 + 2*$outputValue;
    }
}

/** @} */
