/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Settings extends Page {
    HandlePost() {
        let old_refresh_token = this.GetStorage('refresh_token');
        super.HandlePost();
        let metering_point_id = this.GetStorage('metering_point_id', '');
        if (this.post.size) {
            if (this.GetStorage('force')) {
                this.SetStorage('qtys', {});
                this.SetStorage('prices', {});
                this.SetStorage('token', '');
                this.SetStorage('token_life', '');
            }
            if (this.GetStorage('default')) {
                let lines = [
                    [ '2022-01-01', '00:00', '1.25159', '0', '21' ],
                    [ '2022-01-01', '17:00', '1,64599', '0', '21' ],
                    [ '2022-01-01', '20:00', '1,25159', '0', '21' ],
                    [ '2022-04-01', '00:00', '1,16009', '0', '21' ],
                    [ '2022-04-01', '17:00', '1,16489', '0', '21' ],
                    [ '2022-04-01', '20:00', '1,16009', '0', '21' ],
                    [ '2022-07-01', '00:00', '1,17559', '0', '21' ],
                    [ '2022-07-01', '17:00', '1,64039', '0', '21' ],
                    [ '2022-07-01', '20:00', '1,17559', '0', '21' ],
                    [ '2022-10-01', '00:00', '1,13559', '0', '21' ],
                    [ '2022-10-01', '17:00', '1,60039', '0', '21' ],
                    [ '2022-10-01', '20:00', '1,13559', '0', '21' ],
                    [ '2023-01-01', '00:00', '0,29010', '0', '21' ],
                    [ '2023-01-01', '06:00', '0,63030', '0', '21' ],
                    [ '2023-01-01', '17:00', '1,65080', '0', '21' ],
                    [ '2023-01-01', '21:00', '0,63030', '0', '21' ],
                    [ '2023-02-01', '00:00', '0,30370', '0', '44.75' ],
                    [ '2023-02-01', '06:00', '0,67110', '0', '44.75' ],
                    [ '2023-02-01', '17:00', '1,77330', '0', '44.75' ],
                    [ '2023-02-01', '21:00', '0,67110', '0', '44.75' ],
                    [ '2023-03-01', '00:00', '0,27090', '0', '44.75' ],
                    [ '2023-03-01', '06:00', '0,57280', '0', '44.75' ],
                    [ '2023-03-01', '17:00', '1,47840', '0', '44.75' ],
                    [ '2023-03-01', '21:00', '0,57280', '0', '44.75' ],
                    [ '2023-04-01', '00:00', '0,27090', '0', '44.75' ],
                    [ '2023-04-01', '06:00', '0,34640', '0', '44.75' ],
                    [ '2023-04-01', '17:00', '0,70870', '0', '44.75' ],
                    [ '2023-04-01', '21:00', '0,34640', '0', '44.75' ],
                    [ '2023-10-01', '00:00', '0,27090', '0', '44.75' ],
                    [ '2023-10-01', '06:00', '0,57280', '0', '44.75' ],
                    [ '2023-10-01', '17:00', '1,47840', '0', '44.75' ],
                    [ '2023-10-01', '21:00', '0,57280', '0', '44.75' ],
                ];
                for (let i = 0; i < lines.length; i++) {
                    let j = metering_point_id + '_' + i;
                    let [d_, b_, e_, i_, j_] = lines[i];
                    this.post.set('d_charge_' + j, d_);
                    this.post.set('b_charge_' + j, b_);
                    this.post.set('e_charge_' + j, e_);
                    this.post.set('i_charge_' + j, i_);
                    this.post.set('j_charge_' + j, j_);
                }
                this.charge_count = lines.length;
            }
            let charges = {};
            let c_list = ['e_', 'i_', 'j_'];
            for (let [key, val] of this.post) {
                let pk = key.substring(0, 2);
                if (key == 'refresh_token') {
                    val = val.trim();
                    this.post.set(key, val);
                    if (!val.match(/^[0-9A-Za-z.]*/)) {
                        this.error = 'Ulovlige tegn i token';
                        return;
                    }
                }
                if (key == 'price_area') {
                    if (!val.match(/^DK[12]/)) {
                        this.error = 'Ugyldigt prisområde';
                        return;
                    }
                }
                if (pk == 'd_' && val !== '') {
                    if (!val.match(/^\d\d\d\d-\d\d-\d\d/)) {
                        this.error = 'Datoformat skal være åååå-mmm-dd';
                        return;
                    }
                    let k = key.replaceAll('d_', 'b_');
                    let b_val = this.post.get(k);
                    if (!b_val) {
                        b_val = '00:00';
                    }
                    let sort_key = val + ' ' + b_val;
                    for (let c of c_list) {
                        let k = key.replaceAll('d_', c);
                        let v = this.post.get(k);
                        v = v.replaceAll(',', '.');
                        v = parseFloat(v).toString();
                        v = Math.round(v * 1000000) / 1000000;
                        v = v.toString().replaceAll('.', ',');
                        if (!charges[sort_key]) {
                            charges[sort_key] = [];
                        }
                        charges[sort_key].push(v);
                    }
                }
            }
            let keys = Object.keys(charges).sort();
            for (let i = 0; i < this.charge_count; i++) {
                let key = keys[i];
                let value = charges[key];
                let dv;
                let bv;
                if (key) {
                    dv = key;
                    bv = key.substring(11);
                } else {
                    dv = '';
                    bv = '';
                }
                let j = metering_point_id + '_' + i;
                this.SetStorage('d_charge_' + j, dv);
                this.SetStorage('b_charge_' + j, bv);
                for (const c of c_list) {
                    let v;
                    if (value) {
                        v = value.shift();
                    } else {
                        v = '';
                    }
                    this.SetStorage(c + 'charge_' + j, v);
                }
            }
            let refresh_token = this.GetStorage('refresh_token');
            if (refresh_token != old_refresh_token) {
                this.SetStorage('token', '');
                this.SetStorage('token_life', '');
                this.SetStorage('metering_point_id', '');
                this.SetStorage('metering_points', '');
                // This will force RefreshToken to run
                // which will in turn call TokenCallback and
                // PointsCallback
                this.RefreshToken((r) => this.GetPoints(r));
            }
            this.info = 'Indstillinger opdateret';
            this.SaveStorage();
        }
        if (this.error == false && !this.GetStorage('metering_point_id')) {
            let token = this.GetStorage('token');
            if (token) {
                this.SetStorage('token', token);
                this.SetStorage('token_life', Date.now() + 24 * 3600 * 1000);
                this.SaveStorage();
                let data = {
                    action: 'points',
                    token: token
                };
                this.DoAjax(data, this.PointsCallback);
            }
        }
    }

    PointsCallback(data) {
        let body = this.html.First('body');
        this.Alert(body);
        if (this.error) {
            return;
        }
        let result = data.result[0];
        let id = result.meteringPointId;
        let type = result.typeOfMP;
        this.SetStorage('metering_point_id', id);
        this.SetStorage('typeOfMP', type);
        let metering_points = [[type, id]];
        if (result.childMeteringPoints) {
            for (const point of result.childMeteringPoints) {
                metering_points.push([point.typeOfMP, point.meteringPointId]);
            }
        }
        this.SetStorage('metering_points', metering_points);
        console.log('Metering points updated');
        this.SaveStorage();
        this.info = this.saved_info;
        this.Display();
    }

    GetPoints() {
        let token = this.GetStorage('token');
        let data = {
            action: 'points',
            token: token
        };
        this.DoAjax(data, (r) => this.PointsCallback(r));
    }

    MpChanged(e) {
        this.SetStorage('metering_point_id', e.target.value);
        this.SaveStorage();
        this.Display();
    }

    Contents(body, title = '') {
        // console.log(this.GetStorage('metering_points'));
        this.SetChargeCount();
        let div = super.Contents(body, 'Indstillinger');
        this.InputField(div, 'Refresh token', 'refresh_token');
        let select = this.InputSelect(
            div,
            'price_area',
            ['DK1', 'DK2'],
            'Prisområde (DK1/DK2)',
            'DK1 er Danmark vest, DK2 er Danmark øst'
        );
        let metering_point_id = this.GetStorage('metering_point_id', '');
        let metering_points = this.GetStorage('metering_points');
        if (metering_points.length) {
            let select = this.InputSelect(
                div,
                'metering_point_id',
                metering_points,
                'Målepunkt'
            );
        }
        div.H2('Omkostninger i kr. ekskl. moms').class('text-center');
        div.Br();
        let table = div.Table();
        table.class('charges');
        let tr = table.Tr();
        tr.class('text-center');
        let th = tr.Th('Startdato');
        th = tr.Th('Tidsinterval<br>Start');
        th = tr.Th('Pr. kWh');
        th = tr.Th('Pr. døgn');
        th = tr.Th('Pr. måned');
        let b_options = [''];
        for (let i = 0; i < 24; i++) {
            let val = ('0' + i).slice(-2) + ':00';
            b_options.push(val);
        }
        for (let i = 0; i < this.charge_count; i++) {
            let j = metering_point_id + '_' + i;
            let sort_key = this.GetStorage('d_charge_' + j);
            this.SetStorage('d_charge_' + j, sort_key.substring(0, 10));
            let tr = table.Tr();
            this.InputCell(tr, 'd_charge_' + j);  // Date
            this.InputSelectCell(tr, 'b_charge_' + j, b_options);  // First
            this.InputCell(tr, 'e_charge_' + j);  // Energi
            this.InputCell(tr, 'i_charge_' + j);  // Daily
            this.InputCell(tr, 'j_charge_' + j);  // Monthly
        }
        div.Br();
        div.P(`
            Startdatoen angiver starten af perioden.
            Perioden stopper, når næste startdato er den aktuelle`
        );
        this.CheckBox(div, 'default', 'Udfyld konfiguration automatisk');
        this.CheckBox(div, 'force', 'Nulstil midlertidige data');
        this.SubmitButton(div);
    }

    Display() {
        super.Display();
        let select = document.getElementsByTagName('select')[1];
        if (select) {
            select.onchange = ev => this.MpChanged(ev);
        }
        window.addEventListener('resize', this.ChartResize);
    }
}

window.settings = new Settings();
