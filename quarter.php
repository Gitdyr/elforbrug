<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

include('meter.php');

class Fields extends Meter
{
    public function Contents($body, $title = '')
    {
        $len = 4;
        $start = date('Y-m-d', time());
        $quarters = array(
            '01-01 00:00:00',
            '04-01 00:00:00',
            '07-01 00:00:00',
            '10-01 00:00:00'
        );
        $this->Chart($body, $start, $len, $quarters, 0, 7);
    }
}

$page = new Fields();
$page->Display();

?>
