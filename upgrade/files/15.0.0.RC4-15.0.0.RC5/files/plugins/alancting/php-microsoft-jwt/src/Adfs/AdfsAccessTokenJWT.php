<?php

namespace Alancting\Microsoft\JWT\Adfs;

use Alancting\Microsoft\JWT\Base\MicrosoftAccessTokenJWT;

class AdfsAccessTokenJWT extends MicrosoftAccessTokenJWT
{
    protected function getDefaultAudience()
    {
        return 'urn:microsoft:userinfo';
    }
}