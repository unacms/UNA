-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- RC3 to RC4: the string _Member Login of the update pack. The key has a space in it, which a language migration
-- file cannot name, so it is changed here.
UPDATE `sys_localization_strings` SET `String` = 'Log in'
WHERE `IDKey` = (SELECT `ID` FROM `sys_localization_keys` WHERE `Key` = '_Member Login' LIMIT 1)
  AND `IDLanguage` = (SELECT `ID` FROM `sys_localization_languages` WHERE `Name` = 'en' LIMIT 1);
