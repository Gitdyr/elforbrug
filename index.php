<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL | E_STRICT);

include("htmlnode.php");

class Index
{
    public function DoCurl($url, $data = array(), $method = 'GET', $progress = null)
    {
        $ch = curl_init();
        if ($data && $method == 'GET') {
            $filter = $data['filter'];
            unset($data['filter']);
            $query = http_build_query($data);
            $query .= '&filter='.$filter;
            $url .= '?'.$query;
        }
        if ($data && $method == 'POST') {
            $json = json_encode($data, JSON_UNESCAPED_UNICODE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        }

        if (isset($this->token)) {
            $header[] = 'Content-type: application/json';
            $header[] = 'Authorization: Bearer '.$this->token;
            curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        }
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        if ($progress) {
            curl_setopt($ch, CURLOPT_WRITEFUNCTION, $progress);
            // curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, $progress);
            curl_setopt($ch, CURLOPT_NOPROGRESS, false);
            curl_setopt($ch, CURLOPT_BUFFERSIZE, 0x10000);
        }

        $data = curl_exec($ch);
        if (curl_errno($ch)) {
            $this->info = curl_getinfo($ch);
            $error = curl_error($ch);
            if ($error) {
                $this->error = $error;
            } else {
                $this->error = "Connection failed";
            }
            curl_close($ch);
            return false;
        } else {
            curl_close($ch);
            return $data;
        }
    }

    public function HandlePost()
    {
        $json = file_get_contents('php://input');
        if ($json) {
            header('Cache-Control: no-store, no-cache, must-revalidate');
            $data = json_decode($json);
            switch ($data->action) {
                case 'token':
                    $this->token = $data->token;
                    $url = 'https://api.eloverblik.dk/customerapi/api/token';
                    print $this->DoCurl($url);
                    break;
                case 'points':
                    $this->token = $data->token;
                    $url = 'https://api.eloverblik.dk/customerapi/api';
                    $url .= '/meteringpoints/meteringpoints';
                    print $this->DoCurl($url);
                    break;
                case 'prices':
                    $this->Prices($data->start, $data->stop, $data->area);
                    break;
                case 'quantity':
                    $this->token = $data->token;
                    $this->Quantity($data->start, $data->stop, $data->id);
                    break;
            }
            if (!empty($this->error)) {
                $msg = [
                    'error' => $this->error,
                    'info' => $this->info
                ];
                print json_encode($msg);
            }
            exit(0);
        }
    }

    public function ProgressBar($resource, $str)
    {
        print $str;
        flush();
        ob_flush();
        return strlen($str);
    }

    public function Prices($start, $stop, $price_area)
    {
        $prices = array();
        $start = substr($start, 0, 16);
        $start = strtotime($start);
        $stop = substr($stop, 0, 16);
        $stop = strtotime($stop);
        $url = 'https://api.energidataservice.dk/dataset/Elspotprices';
        $data = array(
            'offset' => 0,
            'sort' => 'HourUTC asc',
            'timezone' => 'utc',
            'start' => date('Y-m-d\TH:i', $start),
            'end' => date('Y-m-d\TH:i', $stop),
            'filter' => '{"PriceArea":"'.$price_area.'"}'
        );
        // $this->Dump($data);
        $progress = array($this, 'ProgressBar');
        $this->DoCurl($url, $data, 'GET', $progress);
    }

    public function Quantity($start, $stop, $id)
    {
        $start = strtotime($start);
        $stop = strtotime($stop);
        $sstart = date('c', $start);
        $sstop = date('c', $stop);
        if ($stop > time()) {
            $stop = time();
        }
        $url = 'https://api.eloverblik.dk/customerapi/api';
        $url .= '/meterdata/gettimeseries';
        $url .= '/'.date('Y-m-d', $start);
        $url .= '/'.date('Y-m-d', $stop);
        $url .= '/Hour';
        $data = json_decode('{"meteringPoints":{"meteringPoint":["'.$id.'"]}}');
        $progress = array($this, 'ProgressBar');
        $this->DoCurl($url, $data, 'POST', $progress);
    }

    public function Display()
    {
        $this->HandlePost();
        $this->html = new HtmlNode();
        $bpath = 'bootstrap';
        $head = $this->html->Head();
        $meta = $head->Meta();
        $meta->name("viewport");
        $meta->content("width=device-width, initial-scale=1");
        $head->Title('Elforbrug');
        $link = $head->Link();
        $link->rel('stylesheet');
        $link->href($bpath.'/css/bootstrap.min.css');
        $link = $head->Link();
        $link->rel('stylesheet');
        $link->href('style.css');
        $data = 'test';
        $json = json_encode($data);
        $script = $head->Script("
            var php_result = {
                'data':$json
            }
        ");
        $head->Script()->src($bpath.'/js/bootstrap.min.js')->defer();
        $head->Script()->src('js/htmlnode.js')->defer();
        $head->Script()->src('js/page.js')->defer();
        $head->Script()->src('js/chart.js')->defer();
        $head->Script()->src('js/index.js')->defer();
        $head->Script()->src('js/settings.js')->defer();
        $head->Script()->src('js/points.js')->defer();
        $head->Script()->src('js/meter.js')->defer();
        $this->html->Body();
        $this->html->Display();
    }

}

$index = new Index();
$index->Display();

?>
