# Messenger module (jot-client-una) changes for AI agents — to be merged into the messenger repo, not into UNA core

Files: classes/BxMessengerModule.php, classes/BxMessengerServices.php (full files from the test server, 13.0.0.DEV base).
Every change is marked with `// !!###Agents Message`. Locations:

## classes/BxMessengerModule.php
    120:     // !!###Agents Message
    121:     public function setProfileId($iProfileId)
    647:             // !!###Agents Message — push this jot before onSendJot so a sync agent reply
    648:             // cannot appear on the socket before the message it is answering.
    2412:         // !!###Agents Message
    2413:         $aJotInfo = $this->_oDb->getJotById($iJotId);
    4316:             // !!###Agents Message — socket broadcast lives in sendMessage()
    4317:             return $aResult;
    4510:     // !!###Agents Message
    4511:     public function broadcastNewJot($iLotId, $iJotId)
    4524:         // !!###Agents Message — NEO JotItem expects Services API shape (menu.items)
    4525:         $oServices = new BxMessengerServices();
    4550:             // !!###Agents Message
    4551:             $aData['id'] = mb_strtolower($aLotInfo[$CNF['FIELD_HASH']]);

## classes/BxMessengerServices.php
    484:             // !!###Agents Message — socket broadcast lives in sendMessage()
    485:             return $bResult ? array_merge($aResult, []) : ['msg' => $aResult];
    547:         // !!###Agents Message
    548:         if (!$this->_iProfileId)

Summary:
- setProfileId(): let the core post a jot as the agent profile.
- sendMessage(): broadcastNewJot() before onSendJot() so a sync agent reply cannot reach the socket before the message it answers; broadcastNewJot() pushes the jot in Services API shape (menu.items) for the App.
- onSendJot(): got_jot alert carries subobject_info (the jot row).
- serviceSendMessage() / API send: rely on sendMessage() broadcast, no second push.
- serviceGetAgents(): active message-trigger agents as profile units for the App picker.
