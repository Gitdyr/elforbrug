<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL | E_STRICT);

class Relay
{
    public function DoCurl($url, $data, $method)
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

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);

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
}


$url = urldecode($_SERVER['QUERY_STRING']);
$elspot = 'https://api.energidataservice.dk/dataset/Elspotprices';
if (substr($url, 0, strlen($elspot)) == $elspot) {
    $relay = new Relay();
    $method = 'GET';
    $data = [];
    $json = $relay->DoCurl($url, $data, $method, null);
    print $json;
} else {
    die('Not relayed');
}

?>
