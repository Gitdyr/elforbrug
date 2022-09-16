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
        $start = date('Y-m-d', time());
        $len = 10;
        $this->Chart($body, $start, $len, '01-01 00:00:00', 0, 4);
    }
}

$page = new Fields();
$page->Display();

?>
