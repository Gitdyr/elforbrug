<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

include('page.php');

class Fields extends Page
{
    public function Contents($body, $title = '')
    {
        $url = 'https://api.eloverblik.dk/customerapi/api';
        $url .= '/meteringpoints/meteringpoints';
        // $this->token = $this->Cookie('token');
        $json = $this->DoCurl($url);
        $this->Alert($body);
        $div = parent::Contents($body, 'Målepunkter');
        if ($this->error) {
            return;
        }
        $response = json_decode($json);
        foreach ($response->result as $result) {
            $table = $div->Table();
            $table->class('table mx-auto w-auto');
            foreach ($result as $key => $val) {
                $tr = $table->Tr();
                $tr->Th($key);
                if (is_array($val)) {
                    $td = $tr->Td();
                    foreach ($val as $val2) {
                        $table2 = $td->Table();
                        foreach ($val2 as $k => $v) {
                            $tr2 = $table2->Tr();
                            $tr2->Th()->Small($k);
                            $val = str_replace("\n", '<br>', $v);
                            $tr2->Td()->Small($val)->class('text-break');
                        }
                    }
                    continue;
                }
                $val = str_replace("\n", '<br>', $val);
                $tr->Td($val)->class('text-break');
            }
        }
        // $div->Pre(print_r($response, true));
    }
}

$page = new Fields();
$page->Display();

?>
