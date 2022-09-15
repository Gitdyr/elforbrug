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
        $len = 30 * 3600;
        $start = $this->Get('start', date('Y-m-d', time() - $len));
        $time = strtotime($start);
        $start = date('Y-m-d', $time);
        $stop = date('Y-m-d', $time + $len);
        $this->Chart($body, $start, $stop, '', 11, 5);
    }
}

$page = new Fields();
$page->Display();

?>
