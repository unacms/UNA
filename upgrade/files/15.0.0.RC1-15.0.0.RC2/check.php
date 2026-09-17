<?php

$mixCheckResult = 'Update can not be applied';

$sVer = $this->oDb->getOne("SELECT `version` FROM `sys_modules` WHERE `name` = 'system'");
if ('15.0.0.RC1' == $sVer || '15.0.0-RC1' == $sVer)
    $mixCheckResult = true;

return $mixCheckResult;
