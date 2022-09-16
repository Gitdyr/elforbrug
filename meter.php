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
        // $this->Dump(end($prices));
        return $prices;
    }

    public function Costs($start, $stop)
    {
        $costs = array();
        $start = strtotime($start);
        $stop = strtotime($stop);
        $sstop = date('c', $stop);
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
        $prices = $this->Prices($interval->start, $sstop);
        $qty_sum = 0;
        $cost_sum = 0;
        // $this->Dump($result->Period);
        foreach ($result->Period as $period) {
            foreach ($period->Point as $record) {
                list($time, $price) = current($prices);
                $time = strtotime($time);
                $date = date('Y-m-d H:i:s', $time);
                $qty = $record->{'out_Quantity.quantity'};
                $costs[] = array($date, $qty, $price);
                next($prices);
            }
        }
        while (true) {
            list($time, $price) = current($prices);
            $time = strtotime($time);
            $date = date('Y-m-d H:i:s', $time);
            $costs[] = array($date, 0, $price);
            if (!next($prices)) {
                break;
            }
        }
        return $costs;
    }

    public function GetCharges($date)
    {
        $dv = $ev = $iv = 0;
        for ($i = 0; $i < $this->charge_count; $i++) {
            $dv = $this->Cookie('d_charge_'.$i);
            if ($dv && $date >= $dv) {
                $hour = (int)substr($date, 11, 2);
                if ($hour >= 6 && $hour < 17) {
                    $ev = $this->Cookie('e6_charge_'.$i);
                } elseif ($hour >= 17 && $hour < 21) {
                    $ev = $this->Cookie('e17_charge_'.$i);
                } elseif ($hour >= 21) {
                    $ev = $this->Cookie('e21_charge_'.$i);
                } else {
                    $ev = $this->Cookie('e24_charge_'.$i);
                }
                $iv = $this->Cookie('i_charge_'.$i);
            }
        }
        return array(str_replace(',', '.', $ev), str_replace(',', '.', $iv));
    }

    public function Chart($node, $start, $len, $pattern, $loff, $llen)
    {
        if (empty($_SESSION['costs']) || $_SESSION['timeout'] < time()) {
            $sstart = '2020-10-01';
            $sstop = date('Y-m-d', time() + 2 * 24 * 3600);
            $_SESSION['costs'] = $this->Costs($sstart, $sstop);
            $_SESSION['timeout'] = time() + 3600;
        }
        $script = basename($_SERVER['SCRIPT_NAME'], '.php');
        $meter = substr($script, 0, 2) == 'm_' ? 1 : 0;
        $spot = substr($script, 0, 2) == 's_' ? 1 : 0;
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
        $keys = array();
        $end_key = array_keys($costs);
        $end_key = end($end_key);
        $count = 0;
        $ndx = 0;
        $start_ndx = 0;
        $start = $this->Get('start', $start);
        foreach ($costs as list($key, $qty, $price)) {
            list($ev, $iv) = $this->GetCharges($key);
            $cost = $qty * $price;
            $cost += $qty * $ev + $iv;
            if (in_array(substr($key, $poff, $plen), $pattern)) {
                if ($cost_sum !== null) {
                    $cost_data[] = $cost_sum;
                    $ev_data[] = $ev_sum;
                    $iv_data[] = $iv_sum;
                    $qty_data[] = $qty_sum;
                    $price_data[] = $price_sum / $count;
                    $charge_data[] = $charge_sum / $count;
                    if ($spot) {
                        $vat = ($price_sum + $charge_sum) / $count * 0.25;
                    } else {
                        $vat = ($cost_sum + $ev_sum + $iv_sum) * 0.25;
                    }
                    $vat_data[] = $vat;
                    $cost_sum = 0;
                    $ev_sum = 0;
                    $iv_sum = 0;
                    $qty_sum = 0;
                    $price_sum = 0;
                    $charge_sum = 0;
                    $count = 0;
                    $ndx++;
                }
                $labels[] = substr($key, $loff, $llen);
                $keys[] = $key;
            }
            if (!$labels) {
                $labels[] = substr($key, $loff, $llen);
                $keys[] = $key;
            }
            $cost_sum += $cost;
            $ev_sum += $ev * $qty;
            $iv_sum += $iv;
            $qty_sum += $qty;
            $price_sum += $price;
            $charge_sum += $ev;
            $count++;
            if (substr($key, 0, 10) <= $start) {
                $start_ndx = $ndx + 1;
            }
        }
        $stop_ndx = $start_ndx + $len;
        if ($cost_sum || $qty_sum || $price_sum) {
            $cost_data[] = $cost_sum;
            $ev_data[] = $ev_sum;
            $iv_data[] = $iv_sum;
            $qty_data[] = $qty_sum;
            $price_data[] = $price_sum / $count;
            $charge_data[] = $charge_sum / $count;
            if ($spot) {
                $vat = ($price_sum + $charge_sum) / $count * 0.25;
            } else {
                $vat = ($cost_sum + $ev_sum + $iv_sum) * 0.25;
            }
            $vat_data[] = $vat;
        }

	$cost_sum = array_sum($cost_data);
        $qty_sum = array_sum($qty_data);
        $ev_sum = array_sum($ev_data);
        $iv_sum = array_sum($iv_data);
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
        if (substr($script, 1, 1) == '_') {
            $prefix = substr($script, 0, 2);
        } else {
            $prefix = '';
        }
        switch ($prefix) {
            case '':
                $description = 'Udgift';
                break;
            case 'm_':
                $description = 'Forbrug';
                break;
            case 's_':
                $description = 'Pris';
                break;
        }
        switch ($script) {
            case 'year':
            case 'm_year':
            case 's_year':
                $interval = 'år';
                $click_in = $prefix.'quarter';
                $click_out = '';
                break;
            case 'quarter':
            case 'm_quarter':
            case 's_quarter':
                $interval = 'kvartal';
                $click_in = $prefix.'month';
                $click_out = $prefix.'year';
                break;
            case 'month':
            case 'm_month':
            case 's_month':
                $interval = 'måned';
                $click_in = $prefix.'day';
                $click_out = $prefix.'quarter';
                break;
            case 'day':
            case 'm_day':
            case 's_day':
                $interval = 'dag';
                $click_in = $prefix.'hour';
                $click_out = $prefix.'month';
                break;
            default:
                $interval = 'time';
                $click_in = '';
                $click_out = $prefix.'day';
                break;
        }
        foreach (['Forrige', '+', '-'] as $txt) {
            $button = $node->Button($txt);
            $button->class('btn btn-secondary ms-1 float-start');
            $button->onclick("GraphPrev(this)");
        }
        foreach (['Næste', '+', '-'] as $txt) {
            $button = $node->Button($txt);
            $button->class('btn btn-secondary ms-1 float-end');
            $button->onclick("GraphNext(this)");
        }
        $div = parent::Contents($node, $description.' pr. '.$interval);
        $div->class('btn');
        $div->onclick("GraphParent()");
        $node->Script()->src('chart.js');
	$id = 'myChart';
        $div = $node->Div();
        $canvas = $div->Canvas();
        $canvas->id($id);
	$node->Script("
	    var labels = ".json_encode($labels).";
	    var keys = ".json_encode($keys).";
	    var cost_data = ".json_encode(array_values($cost_data)).";
	    var ev_data = ".json_encode(array_values($ev_data)).";
	    var iv_data = ".json_encode(array_values($iv_data)).";
	    var vat_data = ".json_encode(array_values($vat_data)).";
	    var qty_data = ".json_encode(array_values($qty_data)).";
	    var price_data = ".json_encode(array_values($price_data)).";
	    var charge_data = ".json_encode(array_values($charge_data)).";
	    var click_in = '".$click_in."';
	    var click_out = '".$click_out."';
            var meter = ".$meter.";
            var spot = ".$spot.";
            var ev_sum = ".$ev_sum.";
            var iv_sum = ".$iv_sum.";
            var start_ndx = ".$start_ndx.";
            var stop_ndx = ".$stop_ndx.";
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

            if (ev_sum == 0) {
                data.datasets.splice(2, 1);
            }

            if (iv_sum == 0) {
                data.datasets.splice(1, 1);
            }

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
                if (click_in) {
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
                },
                {
		    label: 'Moms [kr]',
                    id: 'Beløb',
		    backgroundColor: vat_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: vat_data
		}]
            }

	    var config = {
		type: 'bar',
		data: data,
		options: {
                    plugins: {
                        title: {
                            display: true,
                            text: ''
                        },
                        tooltip: {
                            mode: 'index',
                            callbacks: {
                                footer: (tooltipItem) => {
                                    if (tooltipItem.length < 2) {
                                        return '';
                                    }
                                    let sum = 0;
                                    let val = 0;
                                    tooltipItem.forEach(function(tooltipItem) {
                                        val = tooltipItem.parsed.y;
                                        sum += val;
                                    });
                                    if (!spot && !meter) {
                                        sum -= val;
                                    }
                                    return 'I alt: ' + sum.toFixed(2);
                                }
                            }
                        }
		    },
                    responsive: true,
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true
                        }
                    },
                    onClick: (e, a) => {
                         if (click_in) {
                             let dataIndex = a[0].index;
                             let label = e.chart.data.labels[dataIndex];
                             let url = click_in + '.php?start=' + label;
                             location.href = url;
                         }
                    }
		}
	    };

            function ButtonRefresh()
            {
                var len = stop_ndx - start_ndx;
                var start_time;
                var stop_time;
                if (stop_ndx >= data.full_labels.length) {
                    stop_ndx = data.full_labels.length;
                    start_ndx = stop_ndx - len;
                    if (start_ndx < 0) {
                        start_ndx = 0;
                    }
                }
                if (click_in) {
                    start_time = labels[start_ndx];
                    stop_time = labels[stop_ndx - 1];
                } else {
                    start_time = keys[start_ndx];
                    stop_time = keys[stop_ndx - 1].substr(0, 14) + '59:59';
                }
                config.options.plugins.title.text =
                    start_time + ' - ' + stop_time;
                var buttons = document.querySelectorAll('.btn');
                buttons.forEach(function (button) {
                    if (button.classList.contains('float-start')) {
                        button.blur();
                        if (start_ndx == 0 && button.innerText != '-' ||
                            start_ndx == stop_ndx - 1
                            && button.innerText == '-')
                        {
                            button.disabled = true;
                        } else {
                            button.disabled = false;
                        }
                    }
                    if (button.classList.contains('float-end')) {
                        button.blur();
                        if (stop_ndx >= data.full_labels.length &&
                            button.innerText != '-' ||
                            start_ndx == stop_ndx - 1
                            && button.innerText == '-')
                        {
                            button.disabled = true;
                        } else {
                            button.disabled = false;
                        }
                    }
                })
                data.labels = data.full_labels.slice(start_ndx, stop_ndx);
                for (let i = 0; i < data.datasets.length; i++) {
                    data.datasets[i].data =
                        data.datasets[i].full_data.slice(start_ndx, stop_ndx);
                }
                if (chart) {
                    chart.update();
                }
            }

            data.full_labels = data.labels;
            for (let i = 0; i < data.datasets.length; i++) {
                data.datasets[i].full_data = data.datasets[i].data;
            }

            ButtonRefresh();

	    var chart = new Chart(document.getElementById('".$id."'), config);

            function GraphPrev(b) {
                if (b.innerText == '+') {
                    start_ndx -= 1;
                } else if (b.innerText == '-') {
                    start_ndx += 1;
                } else {
                    start_ndx -= 1;
                    stop_ndx -= 1;
                }
                ButtonRefresh();
            }

            function GraphNext(b) {
                if (b.innerText == '+') {
                    stop_ndx += 1;
                } else if (b.innerText == '-') {
                    stop_ndx -= 1;
                } else {
                    start_ndx += 1;
                    stop_ndx += 1;
                }
                ButtonRefresh();
            }

            function GraphParent() {
                if (click_out) {
                    let params = new URLSearchParams(window.location.search);
                    let start = params.get('start');
                    let url = click_out + '.php';
                    if (start) {
                        url += '?start=' + start;
                    }
                    location.href = url;
                }
            }
        ");
    }
}

?>
