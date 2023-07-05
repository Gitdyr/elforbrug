/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Meter extends Page {
    price_color = 'rgb(200, 29, 32)';
    iv_color = 'rgb(55, 99, 32)';
    jv_color = 'rgb(85, 129, 62)';
    ev_color = 'rgb(75, 129, 162)';
    sum_color = 'rgb(255, 199, 132)';
    vat_color = 'rgb(155, 155, 155)';
    qty_color = 'rgb(180, 170, 80)';
    border_color = 'rgb(255, 99, 132)';
    start_ndx = null;
    stop_ndx = null;
    keys = [];
    qty_data = [];
    labels = [];
    datasets = [];
    plugins = {
        title: {
            display: true,
            text: ''
        },
        tooltip: {
            mode: 'x',
            reverse: true,
            callbacks: {
                title: (items) => {
                    let dataIndex = items[0].dataIndex;
                    return this.keys[this.start_ndx + dataIndex];
                },
                label: (item) => {
                    let pval = item.parsed.y.toFixed(3);
                    if (item.dataset.id == 'Mean') {
                        let dataIndex = item.dataIndex;
                        let val = this.qty_data[dataIndex].toFixed(3);
                        pval = pval.replace('.', ',') + ' kr';
                        val = val.replace('.', ',') + ' kWh';
                        // return pval + ' [' + val + ']';
                        return val;
                    } else if (item.dataset.id == 'Quantity') {
                        return pval.replace('.', ',') + ' kWh';
                    }
                    return pval.replace('.', ',') + ' kr';
                },
                footer: (items) => {
                    if (items.length < 2) {
                        return '';
                    }
                    let sum = 0;
                    for (const item of items) {
                        if (item.dataset.id != 'Sum') {
                            sum += item.parsed.y;
                        }
                    }
                    let val = sum.toFixed(2);
                    return 'I alt: ' + val.replace('.', ',') + ' kr';
                }
            },
            filter: (item) => {
                return item.dataset.id != 'Sum';
            }
        },
        legend: {
            onClick: (e, li, l) => {
                const i = li.datasetIndex;
                e.chart.data.datasets[i].hidden =
                    !e.chart.data.datasets[i].hidden;
                if (e.chart.data.datasets[i].id == 'Vat') {
                    let factor = 0.8;
                    if (e.chart.data.datasets[i].hidden) {
                        factor = 1.25;
                    }
                    let tables = e.chart.data.datasets;
                    for (let table of tables) {
                        for (let i = 0; i < table.data.length; i++) {
                            if (table.id != 'Mean' &&
                                table.id != 'Vat' &&
                                table.id != 'Sum'
                            ) {
                                table.data[i] = table.data[i] * factor;
                            }
                        }
                    }
                }
                if (e.chart.data.datasets[i].id != 'Mean') {
                    this.RefreshMean();
                }
                e.chart.update();
            }
        }
    };
    config = {
        type: 'bar',
        data: {
            labels: this.labels,
            datasets: this.datasets
        },
        options: {
            plugins: this.plugins,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: (c) => {
                            if (c.tick.label.length != 10) {
                                return '#666';
                            }
                            let date = new Date(c.tick.label);
                            let wday = 1;
                            let offset = date.getTimezoneOffset() * 60 * 1000;
                            date = new Date(date.getTime() + offset);
                            wday = date.getDay();
                            if (wday == 0 || wday == 6) {
                                return '#f82';
                            } else {
                                return '#666';
                            }
                        }
                    }
                },
                y: {
                    stacked: true
                }
            },
            onClick: (e, a) => {
                 if (this.click_in && a.length) {
                     let dataIndex = a[0].index;
                     let label = e.chart.data.labels[dataIndex];
                     let url = this.click_in + '&start=' + label;
                     this.start_ndx = null;
                     this.stop_ndx = null;
                     window.history.replaceState({}, null, url);
                     this.ShowMeter();
                 }
            }
        }
    }

    ClickInClickOut(prefix, page) {
        let href = location.href.split('?').at(0);
        prefix = href + '?page=' + prefix + '_';
        if (page == 'year') {
            this.interval = 'år';
            this.click_in = prefix + 'quarter';
            this.click_out = '';
        } else if (page == 'quarter') {
            this.interval = 'kvartal';
            this.click_in = prefix + 'month';
            this.click_out = prefix + 'year';
        } else if (page == 'month') {
            this.interval = 'måned';
            this.click_in = prefix + 'day';
            this.click_out = prefix + 'quarter';
        } else if (page == 'day') {
            this.interval = 'dag';
            this.click_in = prefix + 'hour';
            this.click_out = prefix + 'month';
        } else {
            this.interval = 'time';
            this.click_in = '';
            this.click_out = prefix + 'day';
        }
    }

    ChartResize() {
        let height = window.innerHeight - 20;
        let j = 0;
        for (let i = 0; i < document.body.children.length; i++) {
            let style =  window.getComputedStyle(document.body.children[i]);
            height -= document.body.children[i].clientHeight;
            // height -= parseInt(style.height);
            height -= parseInt(style.marginTop);
            height -= parseInt(style.marginBottom);
            height -= parseInt(style.borderTop);
            height -= parseInt(style.borderBottom);
            if (document.body.children[i].nodeName == 'DIV') {
                j = i;
            }
        }
        height += document.body.children[j].clientHeight;
        document.body.children[j].style.height = height + 'px';
        document.body.children[j].style['min-height'] = 350 + 'px';
    }

    ShowChart() {
        this.ChartResize();
        this.ButtonRefresh();
        this.chart.update();
    }

    AddIvCharge(data) {
        if (this.Sum(data) == 0) {
            return;
        }
        let dataset = {
            label: 'Afgift pr. døgn [kr]',
            id: 'IvCharge',
            backgroundColor: this.iv_color,
            borderColor: this.border_color,
            stack: 'Stack 0',
            data: data
        };
        this.datasets.push(dataset);
    }

    AddJvCharge(data) {
        if (this.Sum(data) == 0) {
            return;
        }
        let dataset = {
            label: 'Afgift pr. måned [kr]',
            id: 'JvCharge',
            backgroundColor: this.jv_color,
            borderColor: this.border_color,
            stack: 'Stack 0',
            data: data
        };
        this.datasets.push(dataset);
    }

    AddEvCharge(data) {
        if (this.Sum(data) == 0) {
            return;
        }
        let dataset = {
            label: 'Afgift pr. kWh [kr]',
            id: 'EvCharge',
            backgroundColor: this.ev_color,
            borderColor: this.border_color,
            stack: 'Stack 0',
            data: data
        };
        this.datasets.push(dataset);
    }

    AddSum() {
        let tables = this.datasets;
        let data = Array(this.labels.length).fill(0);
        for (let table of tables) {
            for (let i = 0; i < table.data.length; i++) {
                data[i] += table.data[i];
                // table.data[i] += table.data[i];
            }
        }
        let dataset = {
            type: 'line',
            label: 'I alt [kr]',
            id: 'Sum',
            backgroundColor: this.sum_color,
            borderColor: this.sum_color,
            order: -1,
            data: data
        };
        this.datasets.push(dataset);
    }

    AddVat() {
        let tables = this.datasets;
        let data = Array(this.labels.length).fill(0);
        for (let table of tables) {
            for (let i = 0; i < table.data.length; i++) {
                if (table.id != 'Sum') {
                    data[i] += table.data[i] * 0.25;
                }
                table.data[i] += table.data[i] * 0.25;
            }
        }
        let dataset = {
            label: 'Moms [kr]',
            id: 'Vat',
            backgroundColor: this.vat_color,
            borderColor: this.border_color,
            stack: 'Stack 0',
            data: data,
            hidden: true
        };
        this.datasets.push(dataset);
    }

    AddMean(data) {
        this.qty_data = data;
        const tables = this.datasets;
        let cost_sum = 0;
        let qty_sum = 0;
        for (const table of tables) {
            if (table.id == 'Vat') {
                continue;
            }
            if (table.id == 'Sum') {
                continue;
            }
            cost_sum += this.Sum(table.data);
        }
        qty_sum = this.Sum(data);
        if (cost_sum) {
            data = data.map(x => x / qty_sum * cost_sum);
        }
        let dataset = {
            label: 'Vægtet pris [kr]',
            id: 'Mean',
            backgroundColor: this.qty_color,
            borderColor: this.border_color,
            stack: 'Stack 1',
            data: data
        };
        this.datasets.push(dataset);
    }

    AddCost(data) {
        let cost_data = [];
        let dataset = {
            label: 'Spotpris [kr]',
            id: 'Cost',
            backgroundColor: this.price_color,
            borderColor: this.border_color,
            stack: 'Stack 0',
            data: data
        };
        this.datasets.push(dataset);
    }

    AddPrice(data) {
        let label1;
        let label2;
        let label3;
        let dataset = {
            label: 'Spotpris [kr/kWh]',
            id: 'Price',
            backgroundColor: this.price_color,
            borderColor: this.border_color,
            stack: 'Stack 0',
            data: data
        };
        this.datasets.push(dataset);
    }

    AddQuantity(data) {
        let dataset = {
            label: 'Målerdata [kWh]',
            id: 'Quantity',
            backgroundColor: this.qty_color,
            borderColor: this.border_color,
            data: data
        };
        this.datasets.push(dataset);
    }

    GetLastDate(list, def = null) {
        let date;
        let values = Object.values(list);
        if (values.length > 0) {
            date = values.at(-1)[0][0].slice(0, 10);
        } else {
            date = def;
        }
        return date;
    }

    GetLocalTime(now) {
        const date = new Date(now);
        let ldate = date.toLocaleDateString('da-DK');
        let [day, mon, year] = ldate.split('.');
        mon = ('0' + mon).slice(-2);
        day = ('0' + day).slice(-2);
        ldate = [year , mon, day].join('-');
        let ltime = date.toLocaleTimeString('da-DK');
        ltime = ltime.replaceAll('.', ':');
        return ldate + ' ' + ltime;
    }

    QtyProgress(e, req) {
        let divs = document.getElementsByClassName('progress-bar qty'); 
        if (divs.length) {
            let m = req.response.match(/"end":"[^"]*"/g);
            if (m && m.length) {
                m = m.at(-1).slice(7, 17);
                let date = new Date(m);
                if (this.qty_plen > 0) {
                    let width = (date.getTime() - this.qty_pstart);
                    width = width * 100 / this.qty_plen;
                    console.log('qty width=' + width);
                    divs[0].style = 'width: ' + width + '%';
                    divs[0].innerHTML = this.GetLocalTime(date).slice(0, 10);
                }
            }
        }
    }

    PriceProgress(e, req) {
        let divs = document.getElementsByClassName('progress-bar price'); 
        if (divs.length) {
            let m = req.response.match(/"HourDK":"[^"]*"/g);
            if (m && m.length) {
                m = m.at(-1).slice(10, 20);
                let date = new Date(m);
                if (this.price_plen > 0) {
                    let width = (date.getTime() - this.price_pstart);
                    width = width * 100 / this.price_plen;
                    console.log('price width=' + width);
                    divs[0].style = 'width: ' + width + '%';
                    divs[0].innerHTML = this.GetLocalTime(date).slice(0, 10);
                }
            }
        }
    }

    QuantityCallback(data) {
        if (data.error) {
            this.error = data.error;
            console.log(data.info);
            this.Display();
            return;
        }
        // console.log(data);
        if (!data.result) {
            console.log(data);
            return;
        }
        let result = data.result[0].MyEnergyData_MarketDocument;
        let metering_point_id = this.GetStorage('metering_point_id');
        let qtys = this.GetStorage('qtys', {});
        if (!qtys[metering_point_id]) {
            qtys[metering_point_id] = {};
        }
        result = result.TimeSeries[0];
        for (const period of result.Period) {
            let timeInterval = period.timeInterval;
            let date = Date.parse(timeInterval.start);
            let ldate = this.GetLocalTime(date).slice(0, 10);
            let ndx = 0;
            if (!qtys[metering_point_id][ldate]) {
                qtys[metering_point_id][ldate] = [];
            }
            // console.log(timeInterval);
            for (const record of period.Point) {
                // console.log(record);
                let qty = record['out_Quantity.quantity'];
                let time = this.GetLocalTime(date);
                if (qtys[metering_point_id][ldate][ndx]) {
                    qtys[metering_point_id][ldate][ndx][1] = qty;
                } else {
                    qtys[metering_point_id][ldate].push([time, qty]);
                }
                date += 3600 * 1000;
                ndx++;
            }
        }
        this.SetStorage('qtys', qtys);
        let offset;
        console.log('qty_final=' + this.qty_final);
        if (this.qty_final) {
            offset = 24;
            delete this.qty_pstart;
            let progress = document.getElementsByClassName('progress qty'); 
            if (progress.length) {
                setTimeout(() => progress[0].remove(), 1000);
            }
            this.SetStorage('next_qty_update_' + metering_point_id,
                this.GetLocalTime(Date.now() + offset * 3600 * 1000).slice(0, 10));
            this.SaveStorage();
            this.ShowMeter();
        } else {
            offset = 0;
            setTimeout(() => this.GetQtys(true), 2000);
            let progress = document.getElementsByClassName('progress qty'); 
            if (progress.length) {
                setTimeout(() => {
                    let div = progress[0];
                    div.firstChild.remove();
                    div = div.appendChild(document.createElement('div'));
                    div.className = 'progress-bar qty bg-warning';
                    div.setAttribute('role', 'progressbar');
                    div.style = 'width: 0%';
                },
                1000);
            }
        }
    }

    PriceCallback(data) {
        if (data.error) {
            this.error = data.error;
            this.Display();
            return;
        }
        let prices = this.GetStorage('prices', {});
        let ldate = null;
        let ndx = 0;
        for (const record of data.records) {
            let date = record.HourDK.slice(0, 10);
            let time = record.HourDK.replace('T', ' ');
            let price = record.SpotPriceDKK / 1000;
            if (ldate != date) {
                ldate = date;
                ndx = 0;
            }
            if (!prices[ldate]) {
                prices[ldate] = [];
            }
            if (prices[ldate][ndx]) {
                prices[ldate][ndx][2] = price;
            } else {
                prices[ldate].push([time, price]);
            }
            ndx++;
        }
        this.SetStorage('prices', prices);
        let time = this.GetLocalTime(Date.now());
        let next_price_update;
        if (time.slice(11, 13) >= '13') {
            time = this.GetLocalTime(Date.now() + 24 * 3600 * 1000);
        }
        next_price_update = time.slice(0, 11) + '13:00:00';
        this.SetStorage('next_price_update', next_price_update);
        this.SaveStorage();
        this.ShowMeter();
        delete this.price_pstart;
        let progress = document.getElementsByClassName('progress price'); 
        if (progress.length) {
            setTimeout(() => progress[0].remove(), 1000);
        }
    }

    GetPrices(contact_server = true) {
        let price_area = this.GetStorage('price_area');
        if (!price_area) {
            this.error = 'Prisområde er ikke konfigureret';
            return null;
        }
        let prices = this.GetStorage('prices', {});
        let start = '2019-01-01';
        start = this.GetLastDate(prices, start);
        let stop;
        let next_price_update = this.GetStorage('next_price_update');
        let date = new Date(start);
        let offset = date.getTimezoneOffset() * 60 * 1000;
        date = new Date(date.getTime() + offset);
        start = date.toISOString();
        if (contact_server) {
            console.log('next_price_update=' + next_price_update);
        }
        let now = this.GetLocalTime(Date.now());
        if (Object.keys(prices).length && now <= next_price_update) {
            // All data cached
            return prices;
        }
        // stop = this.GetLocalTime(Date.now() + (24 + 11) * 3600 * 1000);
        stop = this.GetLocalTime(Date.now() + 48 * 3600 * 1000);
        stop = stop.slice(0, 10);
        start = this.Get('first', start);
        stop = this.Get('last', stop);
        if (contact_server) {
            console.log('Get prices start=' + start + ' stop=' + stop);
            let data = {
                action: 'prices',
                area: price_area,
                start: start,
                stop: stop
            };
            let date = new Date(start);
            this.price_pstart = date.getTime();
            date = new Date(stop);
            this.price_plen = date.getTime() - this.price_pstart;
            this.DoAjax(data,
                (r) => this.PriceCallback(r),
                (e, r) => this.PriceProgress(e, r));
        }
        return null;
    }

    GetQtys(contact_server) {
        let metering_point_id = this.GetStorage('metering_point_id');
        if (!metering_point_id) {
            this.error = 'Målepunkt er ikke konfigureret';
            return null;
        }
        let qtys = this.GetStorage('qtys', {});
        if (!qtys[metering_point_id]) {
            qtys[metering_point_id] = {};
        }
        qtys = qtys[metering_point_id];
        let start = '2019-01-01';
        start = this.GetLastDate(qtys, start);
        let stop;
        let next_qty_update =
            this.GetStorage('next_qty_update_' + metering_point_id);
        if (contact_server) {
            console.log('next_qty_update=' + next_qty_update);
        }
        let now = this.GetLocalTime(Date.now());
        let first = this.Get('first');
        if (Object.keys(qtys).length && now <= next_qty_update && !first) {
            // All data cached
            return qtys;
        }
        this.SetStorage('next_qty_update_' + metering_point_id, now);
        this.SaveStorage();
        stop = this.GetLocalTime(Date.now()).slice(0, 10);
        start = this.Get('first', start);
        stop = this.Get('last', stop);
        let start_date = new Date(start);
        let stop_date = new Date(stop);
        if (stop_date - start_date > 365 * 24 * 3600 * 1000) {
            start_date.setFullYear(1 + start_date.getFullYear());
            stop = this.GetLocalTime(start_date).slice(0, 10);
            this.qty_final = false;
        } else {
            this.qty_final = true;
        }
        if (contact_server) {
            console.log('Get quantities start=' + start + ' stop=' + stop);
            let token = this.GetStorage('token');
            if (!token) {
                console.log('No token');
                return null;
            }
            let data = {
                action: 'quantity',
                token: token,
                id: metering_point_id,
                start: start,
                stop: stop
            };
            let date = new Date(start);
            this.qty_pstart = date.getTime();
            date = new Date(stop);
            this.qty_plen = date.getTime() - this.qty_pstart;
            this.DoAjax(data,
                (r) => this.QuantityCallback(r),
                (e, r) => this.QtyProgress(e, r));
        }
        return null;
    }

    GetCharges(time, metering_point_id) {
        let dv = 0;
        let ev = 0;
        let iv = 0;
        let jv = 0;
        for (let i = 0; i < this.charge_count; i++) {
            let j = metering_point_id + '_' + i;
            dv = this.GetStorage('d_charge_' + j);
            if (dv && time.slice(0, 10) >= dv.slice(0, 10)) {
                if (time.slice(11) >= dv.slice(11)) {
                    ev = this.GetStorage('e_charge_' + j);
                    iv = this.GetStorage('i_charge_' + j);
                    jv = this.GetStorage('j_charge_' + j);
                }
            }
        }
        ev = parseFloat(ev.toString().replace(',', '.'));
        iv = parseFloat(iv.toString().replace(',', '.'));
        jv = parseFloat(jv.toString().replace(',', '.'));
        let date = new Date(time);
        let date1;
        let date2;
        date1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        date2 = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        let hpd = (date2 - date1) / 1000 / 3600;
        date1 = new Date(date.getFullYear(), date.getMonth(), 0);
        date2 = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        let hpm = (date2 - date1) / 1000 / 3600;
        iv = iv / hpd;
        jv = jv / hpm;
        return [ev, iv, jv];
    }
    
    ShowMeter() {
        let params = new URLSearchParams(location.search);
        let start = params.get('start');
        let stop = params.get('stop');
        let page = params.get('page');
        let prefix;
        let last_qty_time;
        let last_price_time;
        let qty_sum = 0;
        let price_sum = 0;
        let cost_sum = 0;
        let ev_sum = 0;
        let iv_sum = 0;
        let jv_sum = 0;
        let count = 0;
        let loff = 0;
        let llen = 0;
        let key;
        let keys = [];
        let labels = [];
        let qty_data = [];
        let price_data = [];
        let cost_data = [];
        let ev_data = [];
        let iv_data = [];
        let jv_data = [];
        let quarters = [
            '01-01 00:00:00',
            '04-01 00:00:00',
            '07-01 00:00:00',
            '10-01 00:00:00'
        ];
        [prefix, page] = page.split('_');
        this.page = page;
        let interval;
        if (page == 'hour') {
            loff = 11;
            llen = 5;
            interval = 'time';
        } else if (page == 'day') {
            loff = 0;
            llen = 10;
            interval = 'dag';
        } else if (page == 'month') {
            loff = 0;
            llen = 7;
            interval = 'måned';
        } else if (page == 'quarter') {
            loff = 0;
            llen = 7;
            interval = 'kvartal';
        } else if (page == 'year') {
            loff = 0;
            llen = 4;
            interval = 'år';
        }
        let description;
        let qtys;
        let prices;
        if (prefix == 'c') {
            description = 'Udgift';
            qtys = this.GetQtys(false);
            prices = this.GetPrices(false);
        } else if (prefix == 'q') {
            description = 'Forbrug';
            qtys = this.GetQtys(false);
            prices = this.GetPrices(false);
        } else if (prefix == 'p') {
            description = 'Pris';
            qtys = {};
            prices = this.GetPrices(false);
        }
        let cards = document.getElementsByClassName('card-body btn'); 
        for (const card of cards) {
            card.firstChild.innerText = description + ' pr. ' + interval;
        }
        this.ClickInClickOut(prefix, page);
        if (this.price_pstart) {
            let divs = document.getElementsByClassName('progress-bar price'); 
            if (divs.length == 0) {
                let form = document.forms[0];
                let div = form.appendChild(document.createElement('div'));
                div.className = 'progress price mx-5';
                div = div.appendChild(document.createElement('div'));
                div.className = 'progress-bar price bg-danger';
                div.setAttribute('role', 'progressbar');
                div.style = 'width: 0%';
            }
        }
        if (this.qty_pstart) {
            let divs = document.getElementsByClassName('progress-bar qty'); 
            if (divs.length == 0) {
                let form = document.forms[0];
                let div = form.appendChild(document.createElement('div'));
                div.className = 'progress qty mx-5';
                div = div.appendChild(document.createElement('div'));
                div.className = 'progress-bar qty bg-warning';
                div.setAttribute('role', 'progressbar');
                div.style = 'width: 0%';
            }
        }
        if (qtys == null) {
            return;
        }
        if (prices == null) {
            return;
        }
        let metering_point_id = this.GetStorage('metering_point_id', '');
        for (const [date, val] of Object.entries(prices)) {
            let ndx = 0;
            for (let [time, price] of val) {
                let [ev, iv, jv] = this.GetCharges(time, metering_point_id);
                let qty = 0;
                if (qtys[date]) {
                    if (qtys[date][ndx]) {
                        qty = qtys[date][ndx++][1];
                    }
                }
                if (!key) {
                    key = time;
                }
                if (qty) {
                    last_qty_time = time;
                }
                if (price) {
                    last_price_time = time;
                }
                qty = parseFloat(qty);
                price = parseFloat(price);
                if (page == 'hour' ||
                    page == 'day' && time.substring(11) == '00:00:00' ||
                    page == 'month' && time.substring(8) == '01 00:00:00' ||
                    page == 'quarter' && quarters.includes(time.substring(5)) ||
                    page == 'year' && time.substring(5) == '01-01 00:00:00')
                {
                    if (count) {
                        keys.push(key);
                        qty_data.push(qty_sum);
                        price_data.push(price_sum / count);
                        cost_data.push(cost_sum);
                        if (prefix == 'p') {
                            ev_data.push(ev_sum / count);
                            iv_data.push(iv_sum / count);
                            jv_data.push(jv_sum / count);
                        } else {
                            ev_data.push(ev_sum);
                            iv_data.push(iv_sum);
                            jv_data.push(jv_sum);
                        }
                        key = time;
                        qty_sum = 0;
                        price_sum = 0;
                        cost_sum = 0;
                        ev_sum = 0;
                        iv_sum = 0;
                        jv_sum = 0;
                        count = 0;
                    }
                }
                qty_sum += qty;
                price_sum += price;
                cost_sum += qty * price;
                if (prefix == 'p') {
                    ev_sum += ev;
                } else {
                    ev_sum += ev * qty;
                }
                iv_sum += iv;
                jv_sum += jv;
                count++;
            }
        }
        if (count) {
            keys.push(key);
            qty_data.push(qty_sum);
            price_data.push(price_sum / count);
            cost_data.push(cost_sum);
            if (prefix == 'p') {
                ev_data.push(ev_sum / count);
                iv_data.push(iv_sum / count);
                jv_data.push(jv_sum / count);
            } else {
                ev_data.push(ev_sum);
                iv_data.push(iv_sum);
                jv_data.push(jv_sum);
            }
        }
        if (this.start_ndx === null) {
            if (start) {
                this.start_ndx = keys.findIndex((v) => v >= start);
                if (this.start_ndx < 0) {
                    this.start_ndx = null;
                    start = '';
                }
            }
            if (stop) {
                this.stop_ndx = keys.findIndex((v) => v > stop);
                if (this.stop_ndx < 0) {
                    this.stop_ndx = null;
                    stop = '';
                }
            }
            if (!start && !stop) {
                if (prefix == 'p') {
                    stop = last_price_time;
                } else {
                    stop = last_qty_time;
                }
                this.stop_ndx = keys.findIndex((v) => v > stop);
                if (this.stop_ndx < 0) {
                    this.stop_ndx = keys.length;
                }
            }
        }
        this.keys = keys;
        if (this.start_ndx === null && this.stop_ndx !== null) {
            if (page == 'quarter' || page == 'year') {
                this.start_ndx = 0;
            } else {
                this.start_ndx = this.stop_ndx - 1;
                this.start_ndx += this.GetNextSteps(-10) + 1;
            }
        }
        if (this.start_ndx !== null && this.stop_ndx === null) {
            this.stop_ndx = this.start_ndx + 1;
            if (page == 'quarter' || page == 'year') {
                this.stop_ndx = keys.length;
            } else {
                this.stop_ndx += this.GetNextSteps(10) - 1;
            }
        }
        let len = this.stop_ndx - this.start_ndx;
        if (this.start_ndx < 0) {
            this.start_ndx = 0;
            this.stop_ndx = len;
        }
        if (this.stop_ndx >= this.keys.length) {
            this.stop_ndx = this.keys.length;
            this.start_ndx = this.stop_ndx - len;
            if (this.start_ndx < 0) {
                this.start_ndx = 0;
            }
        }
        this.labels.splice(0, this.labels.length);
        this.datasets.splice(0, this.datasets.length);
        labels = keys.slice(this.start_ndx, this.stop_ndx);
        labels = labels.map(x => x.substring(loff, loff + llen));
        labels.map(x => this.labels.push(x));
        if (prefix == 'c') {
            this.AddCost(cost_data.slice(this.start_ndx, this.stop_ndx));
            this.AddIvCharge(iv_data.slice(this.start_ndx, this.stop_ndx));
            this.AddJvCharge(jv_data.slice(this.start_ndx, this.stop_ndx));
            this.AddEvCharge(ev_data.slice(this.start_ndx, this.stop_ndx));
            this.AddSum();
            this.AddVat();
            this.AddMean(qty_data.slice(this.start_ndx, this.stop_ndx));
        }
        if (prefix == 'p') {
            this.AddPrice(price_data.slice(this.start_ndx, this.stop_ndx));
            this.AddIvCharge(iv_data.slice(this.start_ndx, this.stop_ndx));
            this.AddEvCharge(ev_data.slice(this.start_ndx, this.stop_ndx));
            this.AddSum();
            this.AddVat();
        }
        if (prefix == 'q') {
            this.AddQuantity(qty_data.slice(this.start_ndx, this.stop_ndx));
        }
        this.ShowChart();
    }

    RefreshMean() {
        let data = this.qty_data;
        const tables = this.datasets;
        let cost_sum = 0;
        let qty_sum = 0;
        for (const table of tables) {
            if (table.hidden) {
                continue;
            }
            if (table.id == 'Mean') {
                continue;
            }
            if (table.id == 'Sum') {
                continue;
            }
            cost_sum += this.Sum(table.data);
        }
        qty_sum = this.Sum(data);
        if (cost_sum) {
            data = data.map(x => x / qty_sum * cost_sum);
        }
        for (const table of tables) {
            if (table.id == 'Mean') {
                table.data = data;
            }
        }
    }

    ButtonRefresh() {
        let start_time;
        let stop_time;
        if (this.click_in) {
            start_time = this.labels.at(0);
            stop_time = this.labels.at(-1);
        } else {
            start_time = this.keys.at(this.start_ndx);
            stop_time = this.keys.at(this.stop_ndx - 1);
            stop_time = stop_time.substring(0, 14) + '59:59';
        }
        this.config.options.plugins.title.text =
            start_time + ' - ' + stop_time;
        let buttons = document.querySelectorAll('.btn');
        for (let button of buttons) {
            if (button.classList.contains('float-start')) {
                button.blur();
                if (this.start_ndx == 0 &&
                    !button.classList.contains('zoom-in') ||
                    this.start_ndx == this.stop_ndx - 1 &&
                    button.classList.contains('zoom-in'))
                {
                    button.disabled = true;
                } else {
                    button.disabled = false;
                }
            }
            if (button.classList.contains('float-end')) {
                button.blur();
                if (this.stop_ndx >= this.keys.length &&
                    !button.classList.contains('zoom-in') ||
                    this.start_ndx == this.stop_ndx - 1 &&
                    button.classList.contains('zoom-in'))
                {
                    button.disabled = true;
                } else {
                    button.disabled = false;
                }
            }
        }
    }

    GetNextSteps(steps) {
        let date;
        let step_list = {
            'year':1,
            'quarter':1,
            'month':12,
            'day':0,
            'hour':24
        }
        if (this.page == 'hour') {
            if (steps > 0) {
                steps = 23;
                while (this.keys[this.start_ndx + steps] &&
                    this.keys[this.start_ndx].substring(11, 16) !=
                    this.keys[this.start_ndx + steps].substring(11, 16) &&
                    steps < 25)
                {
                    steps++;
                }
                return steps;
            } else {
                steps = -23;
                while (this.keys[this.start_ndx + steps] &&
                    this.keys[this.start_ndx].substring(11, 16) !=
                    this.keys[this.start_ndx + steps].substring(11, 16) &&
                    steps > -25)
                {
                    steps--;
                }
                return steps;
            }
        }
        date = new Date(this.keys[this.start_ndx]);
        if (steps > 0) {
            date.setMonth(date.getMonth() + 1);
        }
        date = new Date(date.getFullYear(), date.getMonth(), 0);
        step_list['day'] = date.getDate();
        if (steps < 0) {
            return -step_list[this.page];
        } else {
            return step_list[this.page];
     }
    }

    PrevNext(e, steps) {
        let b = e.target.parentNode;
        if (steps > 1 || steps < -1) {
            steps = this.GetNextSteps(steps);
        }
        if (b.classList.contains('zoom-out')) {
            if (steps > 0) {
                if (steps > 1 && this.stop_ndx - this.start_ndx == 1) {
                    this.stop_ndx -= 1;
                }
                this.stop_ndx += steps;
            } else {
                if (steps < -1 && this.stop_ndx - this.start_ndx == 1) {
                    this.start_ndx += 1;
                }
                this.start_ndx += steps;
            }
        } else if (b.classList.contains('zoom-in')) {
            if (steps > 0) {
                this.stop_ndx -= steps;
                if (this.stop_ndx <= this.start_ndx) {
                    this.stop_ndx = this.start_ndx + 1;
                }
            } else {
                this.start_ndx -= steps;
                if (this.stop_ndx <= this.start_ndx) {
                    this.start_ndx = this.stop_ndx - 1;
                }
            }
        } else {
            this.start_ndx += steps;
            this.stop_ndx += steps;
        }
        this.ShowMeter();
    }

    GraphPrev(e) {
        let steps = e.shiftKey ? -1 : -10;
        this.PrevNext(e, steps);
    }

    GraphPrevContext(e) {
        let steps = -1;
        this.PrevNext(e, steps);
    }

    GraphNext(e) {
        let steps = e.shiftKey ? 1 : 10;
        this.PrevNext(e, steps);
    }

    GraphNextContext(e) {
        let steps = 1;
        this.PrevNext(e, steps);
    }

    GraphParent() {
        if (this.click_out) {
            let start = this.Get('start');
            let url = this.click_out;
            if (start) {
                url += '&start=' + start;
            }
            this.start_ndx = null;
            this.stop_ndx = null;
            window.history.replaceState({}, null, url);
            this.ShowMeter();
        }
    }

    MpChanged(e) {
        this.SetStorage('metering_point_id', e.target.value);
        this.SaveStorage();
        this.Display();
    }

    HandlePost() {
        super.HandlePost();
        let prefix = this.GetPrefix();
        if (this.Get('force')) {
            this.SetStorage('qtys', {});
            this.SetStorage('prices', {});
            this.SaveStorage();
        }
        if (this.error == false) {
            if (prefix == 'c') {
                this.RefreshToken(() => this.GetQtys(true));
                this.GetPrices();
            } else if (prefix == 'q') {
                this.RefreshToken(() => this.GetQtys(true));
                this.GetPrices();
            } else if (prefix == 'p') {
                this.GetPrices();
            }
        }
        this.start_ndx = null;
        this.stop_ndx = null;
    }

    Contents(body, title = '') {
        let node = body.Div();
        for (const txt of ['rewind', 'zoom-out', 'zoom-in']) {
            let button = node.Button();
            let img = button.Img();
            img.src('img/' + txt + '.svg');
            button.class('btn btn-secondary m-1 float-start');
            button.class(txt);
        }
        for (const txt of ['rewind', 'zoom-out', 'zoom-in']) {
            let button = node.Button();
            let img = button.Img();
            img.src('img/' + txt + '.svg');
            button.class('btn btn-secondary m-1 float-end');
            button.class(txt);
            button.class('flip');
        }
        let ids = this.GetStorage('metering_points');
        let div = super.Contents(node);
        div.class('btn title');
        if (ids.length > 1) {
            let select = this.InputSelect(div, 'metering_point_id', ids);
        }
        node = body.Div();
        let chart_id = 'myChart';
        div = node.Div();
        div.style('height: 100%');
        let canvas = div.Canvas();
        canvas.id(chart_id);
    }

    Display() {
        super.Display();
        let canvas = document.getElementsByTagName('canvas')[0];
        this.chart = new Chart(canvas, this.config);
        let buttons;
        buttons = document.getElementsByClassName('btn float-start'); 
        for (const button of buttons) {
            button.oncontextmenu = ev => this.GraphPrevContext(ev);
            button.onclick = ev => this.GraphPrev(ev);
        }
        buttons = document.getElementsByClassName('btn float-end'); 
        for (const button of buttons) {
            button.oncontextmenu = ev => this.GraphNextContext(ev);
            button.onclick = ev => this.GraphNext(ev);
        }
        buttons = document.getElementsByClassName('btn title'); 
        for (const button of buttons) {
            button.firstChild.onclick = ev => this.GraphParent(ev);
        }
        let select = document.getElementsByTagName('select')[0];
        if (select) {
            select.onchange = ev => this.MpChanged(ev);
        }
        window.onresize = this.ChartResize;
        this.ShowMeter();
    }
}

window.meter = new Meter();
