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
        $time = date('Y-m-01', time());
        $mon = (int)substr($time, 3, 2);
        $time = strtotime($time);
        switch ($mon) {
            case 1:
            case 2:
            case 3:
                $m = 11 + $mon;
                break;
            case 4:
            case 5:
            case 6:
                $m = 8 + $mon;
                break;
            case 7:
            case 8:
            case 9:
                $m = 5 + $mon;
                break;
            case 10:
            case 11:
            case 12:
                $m = 2 + $mon;
                break;
        }
        $m += 6;
        $start = date('Y-m-01', $time - $m * 31 * 24 * 3600);
        $len = 4;
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
