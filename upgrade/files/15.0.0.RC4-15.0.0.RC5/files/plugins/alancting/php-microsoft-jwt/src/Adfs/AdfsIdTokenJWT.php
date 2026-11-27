<?php

namespace Alancting\Microsoft\JWT\Adfs;

use Alancting\Microsoft\JWT\Base\MicrosoftIdTokenJWT;

class AdfsIdTokenJWT extends MicrosoftIdTokenJWT
{
    protected function getDefaultAudience()
    {
        return $this->getConfiguration()->getClientId();
    }
}