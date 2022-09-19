<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL | E_STRICT);

include('page.php');

class Settings extends Page
{
    public function HandlePost()
    {
        parent::HandlePost();
        if ($_POST) {
            $_SESSION['costs'] = array();
            $charges = array();
            $c_list = array('e6_', 'e17_', 'e21_', 'e24_', 'i_');
            foreach ($_POST as $key => $val) {
                $pk = substr($key, 0, 2);
                if ($key == 'refresh_token') {
                    if (!preg_match('/^[0-9A-Za-z.]*$/', $val)) {
                        $this->error = 'Ulovlige tegn i token';
                        return;
                    }
                }
                if ($key == 'price_area') {
                    if (!preg_match('/^DK[12]$/', $val)) {
                        $this->error = 'Ugyldigt prisområde';
                        return;
                    }
                }
                if ($pk == 'd_' && $val !== '') {
                    if (!preg_match('/^\d\d\d\d-\d\d-\d\d$/', $val)) {
                        $this->error = 'Datoformat skal være åååå-mmm-dd';
                        return;
                    }
                    foreach ($c_list as $c) {
                        $k = str_replace('d_', $c, $key);
                        $v = $this->Cookie($k);
                        $v = array_sum(explode('+', str_replace(',', '.', $v)));
                        $v = str_replace('.', ',', $v);
                        $charges[$val][] = $v;
                    }
                }
            }
            ksort($charges);
            $keys = array_keys($charges);
            $values = array_values($charges);
            for ($i = 0; $i < $this->charge_count; $i++) {
                if (empty($keys[$i])) {
                    $dv = '';
                } else {
                    $dv = $keys[$i];
                }
                $this->SetCookie('d_charge_'.$i, $dv);
                foreach ($c_list as $c) {
                    if (empty($values[$i])) {
                        $v = '';
                    } else {
                        $v = array_shift($values[$i]);
                    }
                    $this->SetCookie($c.'charge_'.$i, $v);
                }
            }
            $url = 'https://api.eloverblik.dk/customerapi/api/token';
            $val = $this->Cookie('refresh_token');
            if ($val) {
                $this->token = $val;
                $json = $this->DoCurl($url);
                if ($json) {
                    $this->info = 'Indstillinger opdateret';
                    $res = json_decode($json);
                    setcookie('token', $res->result, time() + 3600);
                    $this->token = $res->result;
                    $url = 'https://api.eloverblik.dk/customerapi/api';
                    $url .= '/meteringpoints/meteringpoints';
                    $json = $this->DoCurl($url);
                    $response = json_decode($json);
                    $result = reset($response->result);
                    $id = $result->meteringPointId;
                    setcookie('meteringPointId', $id, time() + 0x2000000);
                }
            }
        }
    }

    public function Contents($body, $title = '')
    {
        $div = parent::Contents($body, 'Indstillinger');
        $this->InputField($div, 'Refresh token', 'refresh_token');
        $select = $this->InputSelect($div,
            'Prisområde (DK1/DK2)',
            ['DK1', 'DK2'],
            'price_area',
            'DK1 er Danmark vest, DK2 er Danmark øst');
        $div->Center()->H2('Omkostninger ekskl. moms');
        $div->Br();
        $table = $div->Table();
        $tr = $table->Tr();
        $th = $tr->Th()->Center('Startdato');
        $th = $tr->Th()->Center('Pr. kWh<br>06-17');
        $th = $tr->Th()->Center('Pr. kWh<br>17-21');
        $th = $tr->Th()->Center('Pr. kWh<br>21-24');
        $th = $tr->Th()->Center('Pr. kWh<br>24-06');
        $th = $tr->Th()->Center('Pr. time');
        for ($i = 0; $i < $this->charge_count; $i++) {
            $tr = $table->Tr();
            $this->InputCell($tr, $name = 'd_charge_'.$i);
            $this->InputCell($tr, $name = 'e6_charge_'.$i);
            $this->InputCell($tr, $name = 'e17_charge_'.$i);
            $this->InputCell($tr, $name = 'e21_charge_'.$i);
            $this->InputCell($tr, $name = 'e24_charge_'.$i);
            $this->InputCell($tr, $name = 'i_charge_'.$i);
        }
        $div->Br();
        $div->P('Startdatoen angiver starten af perioden. '.
            'Perioden stopper, når næste startdato er den aktuelle');
        $this->SubmitButton($div);
    }
}

$page = new Settings();
$page->Display();

?>
