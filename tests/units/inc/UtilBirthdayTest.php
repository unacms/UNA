<?php

/**
 * bx_birthday2age: an empty birthday (MySQL's 0000-00-00) has no age, never the current year.
 */
class UtilBirthdayTest extends BxDolTestCase
{
    public function testAgeInFullYears()
    {
        $iYear = (int)date('Y');

        $this->assertSame(30, bx_birthday2age(($iYear - 30) . '-01-01'));
        $this->assertSame(30, bx_birthday2age(($iYear - 30) . '-01-01 00:00:00'), 'with a time');
        $this->assertSame(date('m-d') === '12-31' ? 30 : 29, bx_birthday2age(($iYear - 30) . '-12-31'), 'before the birthday this year');
    }

    public function testTheDayBeforeAndOnTheBirthday()
    {
        $iYear = (int)date('Y') - 20;
        $sToday = date('m-d');
        $sTomorrow = date('m-d', strtotime('+1 day'));

        $this->assertSame(20, bx_birthday2age($iYear . '-' . $sToday), 'on the birthday');
        if ($sTomorrow !== '01-01')
            $this->assertSame(19, bx_birthday2age($iYear . '-' . $sTomorrow), 'the day before it');
    }

    public function testEmptyBirthdayHasNoAge()
    {
        foreach (['', null, '0000-00-00', '0000-00-00 00:00:00', '0000-00-00Z', 'not a date', '12-04-1990'] as $mValue)
            $this->assertSame(0, bx_birthday2age($mValue), var_export($mValue, true));
    }

    public function testFutureBirthdayHasNoAge()
    {
        $this->assertSame(0, bx_birthday2age(((int)date('Y') + 1) . '-06-01'));
    }
}
