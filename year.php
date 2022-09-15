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
        $start = '2020-10-01';
        $stop = date('Y-m-d', time());
        $this->Chart($body, $start, $stop, '01-01 00:00:00', 0, 4);
        $this->Alert($body);
    }
}

$page = new Fields();
$page->Display();

?>
