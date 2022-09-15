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
        $script = basename($_SERVER['SCRIPT_NAME'], '.php');
        $spot = substr($script, 0, 2) == 's_' ? 48 * 3600 : 0;
        $len = 30 * 3600;
        $start = $this->Get('start', date('Y-m-d', time() - $len));
        $time = strtotime($start);
        $start = date('Y-m-d', $time + $spot);
        $stop = date('Y-m-d', $time + $len + $spot);
        $this->Chart($body, $start, $stop, '', 11, 5);
    }
}

$page = new Fields();
$page->Display();

?>
