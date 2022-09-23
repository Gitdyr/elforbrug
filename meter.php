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
    public function HandlePost()
    {
        parent::HandlePost();
        if ($_POST) {
            $ids = explode(',', $this->Cookie('meteringPoints'));
            foreach ($ids as $val) {
                list($id, $type) = explode(':', $val);
                if ($type == $this->Cookie('typeOfMP')) {
                    $this->SetCookie('meteringPointId', $id);
                }
            }
        }
    }

    public function ProgressBar($resource, $str)
    {
        $this->buffer[] = $str;
        $len = strlen($str);
        $this->dl += $len;
        $dl = $this->dl;
        $dl_size = $this->dl_size;
        if ($dl_size) {
            $progress = $dl / $dl_size * 100;
        } else {
            $progress = 0;
        }
        if (isset($this->progress_color)) {
            print "
            <script>
                var bar = document.getElementsByClassName('progress-bar');
                bar[0].className = 'progress-bar $this->progress_color';
            </script>\n";
            unset($this->progress_color);
        }
        print "
        <script>
            var bar = document.getElementsByClassName('progress-bar');
            bar[0].style.width = '".$progress."%';
        </script>
        ";
        for ($j = 0; $j < 128; $j++) {
            print "<!---------------------------->\n";
        }
        flush();
        ob_flush();
        return strlen($str);
    }

    public function Progress($node)
    {
        $div = $node->Div();
        $div->class('progress mx-5');
        $div = $div->Div();
        $div->class('progress-bar');
        $div->role('progressbar');
        $div->style('width: 0%');
        ob_start();
        $this->html->Display();
        $s = ob_get_contents();
        ob_clean();
        $this->skip_len = strlen($s);
        $this->display_off = true;
        print substr($s, 0, -18);
        flush();
        ob_flush();
    }

    public function Prices($start, $stop)
    {
        $prices = array();
        $start = substr($start, 0, 16);
        $start = strtotime($start);
        $stop = substr($stop, 0, 16);
        $stop = strtotime($stop);
        $this->buffer = array();
        $this->dl = 0;
        $this->dl_size = ($stop - $start) / 26.78;
        $url = 'https://api.energidataservice.dk/dataset/Elspotprices';
        $price_area = $this->Cookie('price_area');
        if (!$price_area) {
            $price_area = 'DK2';
        }
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
        $this->progress_color = 'bg-success';
        $json = $this->DoCurl($url, $data, 'GET', $progress);
        $json = implode('', $this->buffer);
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
        $sstart = date('c', $start);
        $sstop = date('c', $stop);
        if ($stop > time()) {
            $stop = time();
        }
        $id = $this->Cookie('meteringPointId');
        if (empty($this->token) || empty($id)) {
            $prices = $this->Prices($sstart, $sstop);
            foreach ($prices as list($time, $price)) {
                $time = strtotime($time);
                $date = date('Y-m-d H:i:s', $time);
                $costs[] = array($date, 0, $price);
            }
            return $costs;
        }
        $this->buffer = array();
        $this->dl = 0;
        $this->dl_size = ($stop - $start) / 43.92;
        $url = 'https://api.eloverblik.dk/customerapi/api';
        $url .= '/meterdata/gettimeseries';
        $url .= '/'.date('Y-m-d', $start);
        $url .= '/'.date('Y-m-d', $stop);
        $url .= '/Hour';
        $data = json_decode('{"meteringPoints":{"meteringPoint":["'.$id.'"]}}');
        $progress = array($this, 'ProgressBar');
        $json = $this->DoCurl($url, $data, 'POST', $progress);
        $json = implode('', $this->buffer);
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
            if ($dv && substr($date, 0, 10) >= substr($dv, 0, 10)) {
                if (substr($date, 11, 5) >= substr($dv, 11, 5)) {
                    $ev = $this->Cookie('e_charge_'.$i);
                    $iv = $this->Cookie('i_charge_'.$i);
                }
            }
        }
        return array(str_replace(',', '.', $ev), str_replace(',', '.', $iv));
    }

    public function Chart($body, $start, $len, $pattern, $loff, $llen)
    {
        $script = explode('_', basename($_SERVER['SCRIPT_NAME'], '.php'));
        if (count($script) == 1) {
            $prefix = '';
        } else {
            $prefix = reset($script).'_';
        }
        $script = end($script);
        $meter = $prefix == 'm_' ? 1 : 0;
        $spot = $prefix == 's_' ? 1 : 0;
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
                $interval = 'år';
                $click_in = $prefix.'quarter';
                $click_out = '';
                break;
            case 'quarter':
                $interval = 'kvartal';
                $click_in = $prefix.'month';
                $click_out = $prefix.'year';
                break;
            case 'month':
                $interval = 'måned';
                $click_in = $prefix.'day';
                $click_out = $prefix.'quarter';
                break;
            case 'day':
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
        $node = $body->Div();
        foreach (['Forrige', '+', '-'] as $txt) {
            $button = $node->Button($txt);
            $button->class('btn btn-secondary m-1 float-start');
            $button->oncontextmenu('GraphPrevContext(event)');
            $button->onclick('GraphPrev(event)');
        }
        foreach (['Næste', '+', '-'] as $txt) {
            $button = $node->Button($txt);
            $button->class('btn btn-secondary m-1 float-end');
            $button->oncontextmenu('GraphNextContext(event)');
            $button->onclick('GraphNext(event)');
        }
        $id = $this->Cookie('meteringPointId');
        $ids = explode(',', $this->Cookie('meteringPoints'));
        $div = parent::Contents($node, $description.' pr. '.$interval);
        $div->class('btn');
        $div->onclick('GraphParent()');
        if (count($ids) > 1) {
            $keys = array();
            foreach ($ids as $key) {
                $key = explode(':', $key);
                $keys[] = end($key);
            }
            $select = $this->InputSelect($div->parent, 'typeOfMP', $keys);
            $select->onchange('this.form.submit()');
        }

        if ($this->Get('force_update') ||
            empty($_SESSION['costs'][$id]) ||
            $_SESSION['timeout'] < time())
        {
            $this->Progress($node);
            $sstart = '2020-10-01';
            $sstop = date('Y-m-d', time() + 2 * 24 * 3600);
            $_SESSION['costs'][$id] = $this->Costs($sstart, $sstop);
            $time = time();
            if (date('H', $time) < 13) {
                $date = date('Y-m-d 13:00:00', $time);
            } else {
                $date = date('Y-m-d 00:00:00', $time + 24 * 3600);
            }
            $_SESSION['timeout'] = strtotime($date);
        }
        $costs = $_SESSION['costs'][$id];
        $ev_data = array();
        $iv_data = array();
        $qty_data = array();
        $cost_data = array();
        $ev_sum = null;
        $iv_sum = null;
        $qty_sum = null;
        $cost_sum = null;
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
        $last_qty_ndx = 0;
        $start = $this->Get('start', $start);
        foreach ($costs as list($key, $qty, $price)) {
            list($ev, $iv) = $this->GetCharges($key);
            if (in_array(substr($key, $poff, $plen), $pattern)) {
                if ($cost_sum !== null) {
                    if ($spot) {
                        $ev_data[] = $ev_sum / $count;
                        $iv_data[] = $iv_sum / $count;
                        $cost_data[] = $cost_sum / $count;
                    } else {
                        $ev_data[] = $ev_sum;
                        $iv_data[] = $iv_sum;
                        $cost_data[] = $cost_sum;
                    }
                    $qty_data[] = $qty_sum;
                    $ev_sum = 0;
                    $iv_sum = 0;
                    $qty_sum = 0;
                    $cost_sum = 0;
                    $count = 0;
                    $ndx++;
                    if ($qty) {
                        $last_qty_ndx = $ndx;
                    }
                }
                $labels[] = substr($key, $loff, $llen);
                $keys[] = $key;
            }
            if (!$labels) {
                $labels[] = substr($key, $loff, $llen);
                $keys[] = $key;
            }
            if ($spot) {
                $ev_sum += $ev;
                $cost_sum += $price;
            } else {
                $ev_sum += $ev * $qty;
                $cost_sum += $price * $qty;
            }
            $iv_sum += $iv;
            $qty_sum += $qty;
            $count++;
            if (substr($key, 0, 10) < $start) {
                $start_ndx = $ndx + 1;
            }
        }
        $stop_ndx = $start_ndx + $len;
        if ($stop_ndx > $last_qty_ndx && !$spot && !$this->Get('start')) {
            $stop_ndx = $last_qty_ndx + 1;
            $start_ndx = $stop_ndx - $len;
        }
        if ($cost_sum || $qty_sum) {
            if ($spot) {
                $ev_data[] = $ev_sum / $count;
                $iv_data[] = $iv_sum / $count;
                $cost_data[] = $cost_sum / $count;
            } else {
                $ev_data[] = $ev_sum;
                $iv_data[] = $iv_sum;
                $cost_data[] = $cost_sum;
            }
            $qty_data[] = $qty_sum;
        }

        $node = $body->Div();
        $node->Script()->src('chart.js');
	$id = 'myChart';
        $div = $node->Div();
        $body->parent->style('height: 100%');
        $body->style('height: 100%');
        $div->style('height: 100%');
        $canvas = $div->Canvas();
        $canvas->id($id);
        // Limit to 1000 entries
        $tables = array(
            &$labels,
            &$keys,
            &$ev_data,
            &$iv_data,
            &$qty_data,
            &$cost_data,
        );
        if (!$spot && $last_qty_ndx + 1 < count($labels)) {
            foreach ($tables as &$table) {
                $table = array_slice($table, 0, $last_qty_ndx + 1);
            }
        }
        $limit = 240;
        if ($start_ndx - $limit > 0) {
            foreach ($tables as &$table) {
                $table = array_slice($table, $start_ndx - $limit);
            }
            $stop_ndx -= $start_ndx - $limit;
            $start_ndx = $limit;
        }
        if ($stop_ndx + $limit < count($labels)) {
            foreach ($tables as &$table) {
                $table = array_slice($table, 0, $stop_ndx + $limit);
            }
        }
        array_shift($tables);
        array_shift($tables);
        foreach ($tables as &$table) {
            foreach ($table as &$val) {
                $val = round($val, 3);
            }
        }
	$node->Script("
	    var labels = ".json_encode($labels).";
	    var keys = ".json_encode($keys).";
	    var ev_data = ".json_encode($ev_data).";
	    var iv_data = ".json_encode($iv_data).";
	    var qty_data = ".json_encode($qty_data).";
	    var cost_data = ".json_encode($cost_data).";
            var vat_data = [];
	    var click_in = '".$click_in."';
	    var click_out = '".$click_out."';
            var script = '".$script."';
            var meter = ".$meter.";
            var spot = ".$spot.";
            var start_ndx = ".$start_ndx.";
            var stop_ndx = ".$stop_ndx.";
            var spot_color = 'rgb(200, 29, 32)';
            var iv_color = 'rgb(55, 99, 32)';
            var ev_color = 'rgb(75, 129, 162)';
            var vat_color = 'rgb(155, 155, 155)';
            var qty_color = 'rgb(180, 170, 80)';
            const legendClick = Chart.defaults.plugins.legend.onClick;

            function Sum(data)
            {
                return data.reduce((s, a) => s + a, 0);
            }

            function ChartResize()
            {
                var height = document.body.clientHeight - 40;
                for (var i = 0; i < document.body.children.length - 1; i++) {
                    var h = document.body.children[i].clientHeight;
                    height -= document.body.children[i].clientHeight;
                }
                document.body.children[i].style.height = height + 'px';
            }

            window.onload = ChartResize();
            window.addEventListener('resize', ChartResize);

            if (!meter) {
                var tables = [cost_data, iv_data, ev_data]
                var vat_data = Array(labels.length).fill(0);
                for (let i = 0; i < tables.length; i++) {
                    for (let j = 0; j < tables[i].length; j++) {
                        vat_data[j] += tables[i][j] * 0.25;
                    }
                }
            }

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

            if (spot) {
                var label1;
                var label2;
                if (click_in) {
                    label1 = 'Gennemsnitspris [kr/kWh]';
		    label2 = 'Gennemsnitsafgift pr. time [kr]';
		    label3 = 'Gennemsnitsafgift pr. kWh [kr]';
                } else {
                    label1 = 'Spotpris [kr/kWh]';
                    label2 = 'Afgift pr. time [kr/kWh]';
		    label3 = 'Afgift pr. kWh [kr]';
                }
                data.datasets = [{
		    label: label1,
                    id: 'Energi',
		    backgroundColor: spot_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: cost_data
                },
                {
		    label: label2,
                    id: 'Energi',
		    backgroundColor: iv_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: iv_data
                },
                {
		    label: label3,
                    id: 'Energi',
		    backgroundColor: ev_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: ev_data
                },
                {
		    label: 'Moms [kr/kWh]',
                    id: 'Beløb',
		    backgroundColor: vat_color,
		    borderColor: 'rgb(255, 99, 132)',
		    data: vat_data
		}]
            }

            if (Sum(data.datasets[2].data) == 0) {
                data.datasets.splice(2, 1);
            }

            if (Sum(data.datasets[1].data) == 0) {
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
                        },
                        legend: {
                            onClick: (e, li, l) => {
                                const i = li.datasetIndex;
                                chart.data.datasets[i].hidden =
                                    !chart.data.datasets[i].hidden;
                                MeanRefresh();
                                chart.update();
                            }
                        }
		    },
                    responsive: true,
                    maintainAspectRatio: false,
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

            function MeanRefresh()
            {
                const len = data.datasets.length;
                data.datasets[len - 1].data =
                    data.datasets[len - 1].full_data.slice(start_ndx, stop_ndx);
                if (!spot && !meter) {
                    const qty_sum = Sum(data.datasets[len - 1].data);
                    if (qty_sum) {
                        const dlen = data.datasets[len - 1].data.length;
                        var cost_sum = 0;
                        for (let i = 0; i < len - 1; i++) {
                            if (chart && chart.data.datasets[i].hidden) {
                                continue;
                            }
                            cost_sum += Sum(data.datasets[i].data);
                        }
                        var cost_mean = cost_sum / qty_sum;
                        for (let i = 0; i < dlen; i++) {
                            data.datasets[len - 1].data[i] *= cost_mean;
                        }
                    }
                }
            }

            function ButtonRefresh()
            {
                var len = stop_ndx - start_ndx;
                var start_time;
                var stop_time;
                if (start_ndx < 0) {
                    start_ndx = 0;
                    stop_ndx = len;
                }
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
                for (let i = 0; i < data.datasets.length - 1; i++) {
                    data.datasets[i].data =
                        data.datasets[i].full_data.slice(start_ndx, stop_ndx);
                }
                MeanRefresh();
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

            function GetNextSteps(steps) {
                var date;
                var step_list = {
                    'year':1,
                    'quarter':1,
                    'month':12,
                    'day':0,
                    'hour':24
                }
                date = new Date(keys[start_ndx]);
                if (steps > 0) {
                    date.setMonth(date.getMonth() + 1);
                }
                date = new Date(date.getFullYear(), date.getMonth(), 0);
                step_list['day'] = date.getDate();
                if (steps < 0) {
                    return -step_list[script];
                } else {
                    return step_list[script];
                }
            }

            function PrevNext(e, steps) {
                var b = e.target;
                if (steps > 1 || steps < -1) {
                    steps = GetNextSteps(steps);
                }
                if (b.innerText == '+') {
                    if (steps > 0) {
                        if (steps > 1 && stop_ndx - start_ndx == 1) {
                            stop_ndx -= 1;
                        }
                        stop_ndx += steps;
                    } else {
                        if (steps < -1 && stop_ndx - start_ndx == 1) {
                            start_ndx += 1;
                        }
                        start_ndx += steps;
                    }
                } else if (b.innerText == '-') {
                    if (steps > 0) {
                        stop_ndx -= steps;
                        if (stop_ndx <= start_ndx) {
                            stop_ndx = start_ndx + 1;
                        }
                    } else {
                        start_ndx -= steps;
                        if (stop_ndx <= start_ndx) {
                            start_ndx = stop_ndx - 1;
                        }
                    }
                } else {
                    start_ndx += steps;
                    stop_ndx += steps;
                }
                ButtonRefresh();
            }

            function GraphPrev(e) {
                var steps = e.shiftKey ? -1 : -10;
                PrevNext(e, steps);
            }

            function GraphPrevContext(e) {
                var steps = -1;
                PrevNext(e, steps);
            }

            function GraphNext(e) {
                var steps = e.shiftKey ? 1 : 10;
                PrevNext(e, steps);
            }

            function GraphNextContext(e) {
                var steps = 1;
                PrevNext(e, steps);
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
        if (!empty($this->skip_len)) {
            $script = "
                var bar = document.getElementsByClassName('progress');
                for (var i = 0; i < bar.length; i++) {
                    bar[i].remove();
                }
            ";
            $node->Script($script);
            $this->html->Display();
            $s = ob_get_contents();
            ob_clean();
            $l = strstr($s, '<script src="chart.js">');
            if ($l !== false) {
                print $l;
            } else {
                print $s;
            }
            ob_flush();
            ob_clean();
        }
    }
}

?>
