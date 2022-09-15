<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

include('page.php');

class Meter extends Page
{
    public function Prices($start, $stop)
    {
        $prices = array();
        $start = substr($start, 0, 16);
        $start = strtotime($start);
        $stop = substr($stop, 0, 16);
        $stop = strtotime($stop);
        $url = 'https://api.energidataservice.dk/dataset/Elspotprices';
        $price_area = $this->Cookie('price_area');
        $data = array(
            'offset' => 0,
            'sort' => 'HourUTC asc',
            'timezone' => 'utc',
            'start' => date('Y-m-d\TH:i', $start),
            'end' => date('Y-m-d\TH:i', $stop),
            'filter' => '{"PriceArea":"'.$price_area.'"}'
        );
        // $this->Dump($data);
        $json = $this->DoCurl($url, $data);
        $response = json_decode($json);
        foreach ($response->records as $record) {
            $price = $record->SpotPriceDKK / 1000;
            $prices[] = array($record->HourDK, $price);
        }
        // $this->Dump($prices);
        return $prices;
    }

    public function GetCharges($date)
    {
        $dv = $ev = $iv = 0;
        for ($i = 0; $i < $this->charge_count; $i++) {
            $dv = $this->Cookie('d_charge_'.$i);
            if ($dv && $date >= $dv) {
                $ev = $this->Cookie('e_charge_'.$i);
                $iv = $this->Cookie('i_charge_'.$i);
            }
        }
        return array(str_replace(',', '.', $ev), str_replace(',', '.', $iv));
    }
    public function Costs($start, $stop)
    {
        $costs = array();
        $start = strtotime($start);
        $stop = strtotime($stop);
        if ($stop > time()) {
            $stop = time();
        }
        $url = 'https://api.eloverblik.dk/customerapi/api';
        $url .= '/meterdata/gettimeseries';
        $url .= '/'.date('Y-m-d', $start);
        $url .= '/'.date('Y-m-d', $stop);
        $url .= '/Hour';
        $id = $this->Cookie('meteringPointId');
        $data = json_decode('{"meteringPoints":{"meteringPoint":["'.$id.'"]}}');
        $json = $this->DoCurl($url, $data, 'POST');
        $response = json_decode($json);
        if (!$response) {
            $this->Dump($this->info);
            $this->Dump($json);
            return $costs;
        }
        $result = reset($response->result);
        $result = $result->MyEnergyData_MarketDocument;
        $interval = $result->{'period.timeInterval'};
        $result = reset($result->TimeSeries);
        $time = $start;
        $prices = $this->Prices($interval->start, $interval->end);
        $qty_sum = 0;
        $cost_sum = 0;
        foreach ($result->Period as $period) {
            foreach ($period->Point as $record) {
                list($time, $price) = current($prices);
                $time = strtotime($time);
                $date = date('Y-m-d H:i:s', $time);
                $qty = $record->{'out_Quantity.quantity'};
                $costs[$date] = array($qty, $price);
                next($prices);
            }
        }
        return $costs;
    }

    public function Chart($node, $start, $stop, $pattern, $loff, $llen)
    {
        if (empty($_SESSION['costs']) || $_SESSION['timeout'] < time()) {
            $sstart = '2020-10-01';
            $sstop = date('Y-m-d', time());
            $_SESSION['costs'] = $this->Costs($sstart, $sstop);
            $_SESSION['timeout'] = time() + 3600;
        }
        $script = basename($_SERVER['SCRIPT_NAME'], '.php');
        $meter = substr($script, 0, 2) == 'm_' ? 1 : 0;
        $spot = substr($script, 0, 2) == 's_' ? 1 : 0;
        $stop = date('Y-m-d H:i:s', strtotime($stop) - 1);
        $costs = $_SESSION['costs'];
        $cost_data = array();
        $ev_data = array();
        $iv_data = array();
        $vat_data = array();
        $qty_data = array();
        $price_data = array();
        $charge_data = array();
        $cost_sum = null;
        $ev_sum = null;
        $iv_sum = null;
        $qty_sum = null;
        $price_sum = null;
        $charge_sum = null;
        if (!is_array($pattern)) {
          $pattern = array($pattern);
        }
        $plen = strlen($pattern[0]);
        $poff = 19 - $plen;
        $labels = array();
        $end_key = array_keys($costs);
        $end_key = end($end_key);
        $count = 0;
        foreach ($costs as $key => list($qty, $price)) {
            if ($key < $start) {
                continue;
            }
            if ($key >= $stop) {
                break;
            }
            if (empty($title)) {
                $title = $key.' - ';
            }
            if (substr($key, 11) == '00:00:00') {
                list($ev, $iv) = $this->GetCharges($key);
            }
            $cost = $qty * $price;
            $cost += $qty * $ev + $iv;
            if (in_array(substr($key, $poff, $plen), $pattern)) {
                if ($cost_sum !== null) {
                    $cost_data[$label] = $cost_sum;
                    $ev_data[$label] = $ev_sum;
                    $iv_data[$label] = $iv_sum;
                    $vat_data[$label] = ($cost_sum + $ev_sum + $iv_sum) * 0.25;
                    $qty_data[$label] = $qty_sum;
                    $price_data[$label] = $price_sum / $count;
                    $charge_data[$label] = $charge_sum / $count;
                    $cost_sum = 0;
                    $ev_sum = 0;
                    $iv_sum = 0;
                    $qty_sum = 0;
                    $price_sum = 0;
                    $charge_sum = 0;
                    $count = 0;
                }
                $labels[] = substr($key, $loff, $llen);
            }
            if (!$labels) {
                $labels[] = substr($key, $loff, $llen);
            }
            $cost_sum += $cost;
            $ev_sum += $ev * $qty;
            $iv_sum += $iv;
            $qty_sum += $qty;
            $price_sum += $price;
            $charge_sum += $ev;
            $label = $key;
            $count++;
        }
        if ($cost_sum || $qty_sum) {
            $label = $key.'+';
            $cost_data[$label] = $cost_sum;
            $ev_data[$label] = $ev_sum;
            $iv_data[$label] = $iv_sum;
            $vat_data[$label] = ($cost_sum + $ev_sum + $iv_sum) * 0.25;
            $qty_data[$label] = $qty_sum;
            $price_data[$label] = $price_sum / $count;
            $charge_data[$label] = $charge_sum / $count;
        }
        $title .= sprintf("%s", $stop);

	$cost_sum = array_sum($cost_data);
        $qty_sum = array_sum($qty_data);
        if ($cost_sum && $qty_sum) {
            $cost_mean = 5 * array_sum($vat_data) / array_sum($qty_data);
        } else {
            $cost_mean = 1;
        }
        if ($meter == false) {
            foreach ($qty_data as &$val) {
                $val *= $cost_mean;
            }
        }
	// $values = array_values($qty_data);
        $node->Script()->src('chart.js');
	$id = 'myChart';
        $div = $node->Div();
        $canvas = $div->Canvas();
        $canvas->id($id);
        if (substr($script, 1, 1) == '_') {
            $prefix = substr($script, 0, 2);
        } else {
            $prefix = '';
        }
        switch ($script) {
            case 'year':
            case 'm_year':
            case 's_year':
                $click_script = $prefix.'quarter';
                break;
            case 'quarter':
            case 'm_quarter':
            case 's_quarter':
                $click_script = $prefix.'month';
                break;
            case 'month':
            case 'm_month':
            case 's_month':
                $click_script = $prefix.'day';
                break;
            case 'day':
            case 'm_day':
            case 's_day':
                $click_script = $prefix.'hour';
                break;
            default:
                $click_script = '';
                break;
        }
	$node->Script("
	    var labels = ".json_encode($labels).";
	    var cost_data = ".json_encode(array_values($cost_data)).";
	    var ev_data = ".json_encode(array_values($ev_data)).";
	    var iv_data = ".json_encode(array_values($iv_data)).";
	    var vat_data = ".json_encode(array_values($vat_data)).";
	    var qty_data = ".json_encode(array_values($qty_data)).";
	    var price_data = ".json_encode(array_values($price_data)).";
	    var charge_data = ".json_encode(array_values($charge_data)).";
	    var title = '".$title."';
	    var click_script = '".$click_script."';
            var meter = ".$meter.";
            var spot = ".$spot.";
            var spot_color = 'rgb(200, 29, 32)';
            var iv_color = 'rgb(55, 99, 32)';
            var ev_color = 'rgb(75, 129, 162)';
            var vat_color = 'rgb(155, 155, 155)';
            var qty_color = 'rgb(180, 170, 80)';

	    var data = {
		labels: labels,
		datasets: [{
		    label: 'Spotpris [kr]',
                    id: 'Beløb',
		    backgroundColor: spot_color,
		    borderColor: 'rgb(255, 99, 132)',
                    stack: 'Stack 0',
		    data: cost_data
		},
                {
		    label: 'Afgift pr. time [kr]',
                    id: 'Beløb',
		    backgroundColor: iv_color,
		    borderColor: 'rgb(255, 99, 132)',
                    stack: 'Stack 0',
		    data: iv_data
		},
                {
		    label: 'Afgift pr. kWh [kr]',
                    id: 'Beløb',
		    backgroundColor: ev_color,
		    borderColor: 'rgb(255, 99, 132)',
                    stack: 'Stack 0',
		    data: ev_data
		},
                {
		    label: 'Moms [kr]',
                    id: 'Beløb',
		    backgroundColor: vat_color,
		    borderColor: 'rgb(255, 99, 132)',
                    stack: 'Stack 0',
		    data: vat_data
		},
                {
		    label: 'Vægtet pris [kr]',
                    id: 'Energi',
		    backgroundColor: qty_color,
		    borderColor: 'rgb(255, 99, 132)',
                    stack: 'Stack 1',
		    data: qty_data
                }]
	    };

            if (meter) {
                data.datasets = [{
		    label: 'Målerdata [kWh]',
                    id: 'Energi',
		    backgroundColor: qty_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: qty_data
                }];
            }

            if (spot) {
                var label1;
                var label2;
                if (click_script) {
                    label1 = 'Gennemsnitspris [kr]';
                    label2 = 'Gennemsnitsafgift [kr]';
                } else {
                    label1 = 'Spotpris pr. kWh [kr]';
                    label2 = 'Afgift pr. kWh [kr]';
                }
                data.datasets = [{
		    label: label1,
                    id: 'Energi',
		    backgroundColor: spot_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: price_data
                },
                {
		    label: label2,
                    id: 'Energi',
		    backgroundColor: ev_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: charge_data
                }];
            }

	    var config = {
		type: 'bar',
		data: data,
		options: {
                    plugins: {
                        title: {
                            display: true,
                            text: title
                        }
		    },
                    responsive: true,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true }
                    },
                    onClick: (e, a) => {
                         let dataIndex = a[0].index;
                         let label = e.chart.data.labels[dataIndex];
                         console.log('In click', label);
                         if (click_script) {
                             let url = click_script + '.php?start=' + label;
                             location.href = url;
                         }
                    }
		}
	    };

	    new Chart(document.getElementById('".$id."'), config);
        ");
    }

}

?>
