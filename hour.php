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
        $spot = substr($script, 0, 2) == 's_' ? 2 * 48 * 3600 : 0;
        $len = 24;
        $start = date('Y-m-d', time() + $spot);
        $this->Chart($body, $start, $len, '', 11, 5);
    }
}

$page = new Fields();
$page->Display();

?>
