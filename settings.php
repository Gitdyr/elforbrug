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
            $charges = array();
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
                    $ek = str_replace('d_', 'e_', $key);
                    $ev = $this->Cookie($ek);
                    $ev = (float)str_replace(',', '.', $ev);
                    $ev = str_replace('.', ',', $ev);

                    $ik = str_replace('d_', 'i_', $key);
                    $iv = $this->Cookie($ik);
                    $iv = (float)str_replace(',', '.', $iv);
                    $iv = str_replace('.', ',', $iv);

                    $charges[$val] = array($ev, $iv);
                }
            }
            ksort($charges);
            $keys = array_keys($charges);
            $values = array_values($charges);
            for ($i = 0; $i < $this->charge_count; $i++) {
                if (empty($keys[$i])) {
                    $dv = $ev = $iv = '';
                } else {
                    $dv = $keys[$i];
                    $ev = $values[$i][0];
                    $iv = $values[$i][1];
                }
                $this->SetCookie('d_charge_'.$i, $dv);
                $this->SetCookie('e_charge_'.$i, $ev);
                $this->SetCookie('i_charge_'.$i, $iv);
            }
            $url = 'https://api.eloverblik.dk/customerapi/api/token';
            $val = $this->Cookie('refresh_token');
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

    public function Contents($body, $title = '')
    {
        $div = parent::Contents($body, 'Indstillinger');
        $this->InputField($div, 'Refresh token', 'refresh_token');
        $this->InputField($div, 'Prisområde (DK1/DK2)', 'price_area',
            'DK1 er Danmark vest, DK2 er Danmark øst');
        $div->Center()->H2('Omkostninger ekskl. moms');
        $table = $div->Table();
        $tr = $table->Tr();
        $th = $tr->Th('Startdato');
        $th = $tr->Th('Pr. kWh');
        $th = $tr->Th('Pr. time');
        for ($i = 0; $i < $this->charge_count; $i++) {
            $tr = $table->Tr();
            $this->InputCell($tr, $name = 'd_charge_'.$i);
            $this->InputCell($tr, $name = 'e_charge_'.$i);
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
