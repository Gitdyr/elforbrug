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
            // this.Dump(this.post);
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
                    let b_val = this.GetStorage(k);
                    if (!b_val) {
                        b_val = '00:00';
                    }
                    let sort_key = val + ' ' + b_val;
                    for (let c of c_list) {
                        let k = key.replaceAll('d_', c);
                        let v = this.GetStorage(k, '0');
                        v = v.replaceAll(',', '.');
                        v = eval(v);
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
            }
            if (this.GetStorage('force')) {
                this.SetStorage('qtys', {});
                this.SetStorage('prices', {});
                this.SetStorage('token', '');
                this.SetStorage('token_life', '');
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

    PointsCallback(data, obj) {
        let body = obj.html.First('body');
        obj.Alert(body);
        if (obj.error) {
            return;
        }
        let result = data.result[0];
        let id = result.meteringPointId;
        let type = result.typeOfMP;
        obj.SetStorage('metering_point_id', id);
        obj.SetStorage('typeOfMP', type);
        let metering_points = [[type, id]];
        if (result.childMeteringPoints) {
            for (const point of result.childMeteringPoints) {
                metering_points.push([point.typeOfMP, point.meteringPointId]);
            }
        }
        obj.SetStorage('metering_points', metering_points);
        console.log('Metering points updated');
        obj.SaveStorage();
        obj.info = obj.saved_info;
        obj.Display();
    }

    TokenCallback(data, obj) {
        let body = obj.html.First('body');
        obj.Alert(body);
        if (obj.error) {
            return;
        }
        let token = data.result;
        if (token) {
            obj.SetStorage('token', token);
            obj.SetStorage('token_life', Date.now() + 24 * 3600 * 1000);
            obj.SaveStorage();
            console.log('Token updated');
            obj.info = obj.saved_info;
            obj.Display();
            let data = {
                action: 'points',
                token: token
            };
            obj.DoAjax(data, obj.PointsCallback);
        } else {
            console.log('Refresh failed');
        }
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
        let metering_points = this.GetStorage('metering_points');
        if (metering_points.length) {
            let metering_point_id = this.GetStorage('metering_point_id', '');
            let select = this.InputSelect(
                div,
                'metering_point_id',
                metering_points,
                'Målepunkt'
            );
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
            div = div.Div();
            div.class('form-check');
            let checkbox = div.Input();
            checkbox.type('checkbox');
            checkbox.name('force');
            checkbox.id('force');
            checkbox.class('form-check-input');
            let label = div.Label('Nulstil midlertidige data');
            label.for('force');
            label.class('form-check-label');
        }
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
