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
            let submitter = this.post.get('submitter');
            let profile = this.post.get('profile');
            if (submitter == 'tmp') {
                this.SetStorage('qtys', {});
                this.SetStorage('prices', {});
                this.SetStorage('token', '');
                this.SetStorage('token_life', '');
            }
            if (submitter == 'profile') {
                let lines = [
                    [ '2022-01-01', '00:00', 'kwh', '2general', '0.90300' ],
                    [ '2022-01-01', '00:00', 'kwh', '3balance', '0.00229' ],
                    [ '2022-01-01', '00:00', 'kwh', '5system', '0.06100' ],
                    [ '2022-01-01', '00:00', 'kwh', '6transm', '0.04900' ],
                    [ '2022-01-01', '00:00', 'kwh', '8radc', '0.23630' ],
                    [ '2022-01-01', '17:00', 'kwh', '8radc', '0.63070' ],
                    [ '2022-01-01', '20:00', 'kwh', '8radc', '0.23630' ],
                    [ '2022-01-01', '00:00', 'month', '9subsc', '21.00' ],

                    [ '2022-04-01', '00:00', 'kwh', '2general', '0.90300' ],
                    [ '2022-04-01', '00:00', 'kwh', '3balance', '0.00229' ],
                    [ '2022-04-01', '00:00', 'kwh', '4pso', '-0.01550' ],
                    [ '2022-04-01', '00:00', 'kwh', '5system', '0.06100' ],
                    [ '2022-04-01', '00:00', 'kwh', '6transm', '0.04900' ],
                    [ '2022-04-01', '00:00', 'kwh', '8radc', '0.30030' ],
                    [ '2022-04-01', '17:00', 'kwh', '8radc', '0.76510' ],
                    [ '2022-04-01', '20:00', 'kwh', '8radc', '0.30030' ],
                    [ '2022-04-01', '00:00', 'month', '9subsc', '21.00' ],

                    [ '2022-07-01', '00:00', 'kwh', '2general', '0.90300' ],
                    [ '2022-07-01', '00:00', 'kwh', '3balance', '0.00229' ],
                    [ '2022-07-01', '00:00', 'kwh', '5system', '0.06100' ],
                    [ '2022-07-01', '00:00', 'kwh', '6transm', '0.04900' ],
                    [ '2022-07-01', '00:00', 'kwh', '8radc', '0.30030' ],
                    [ '2022-07-01', '17:00', 'kwh', '8radc', '0.76510' ],
                    [ '2022-07-01', '20:00', 'kwh', '8radc', '0.30030' ],
                    [ '2022-07-01', '00:00', 'month', '9subsc', '21.00' ],

                    [ '2022-10-01', '00:00', 'kwh', '2general', '0.72300' ],
                    [ '2022-10-01', '00:00', 'kwh', '3balance', '0.00229' ],
                    [ '2022-10-01', '00:00', 'kwh', '5system', '0.06100' ],
                    [ '2022-10-01', '00:00', 'kwh', '6transm', '0.04900' ],
                    [ '2022-10-01', '00:00', 'kwh', '8radc', '0.30030' ],
                    [ '2022-10-01', '17:00', 'kwh', '8radc', '0.76510' ],
                    [ '2022-10-01', '20:00', 'kwh', '8radc', '0.30030' ],
                    [ '2022-10-01', '00:00', 'month', '9subsc', '21.00' ],

                    [ '2023-01-01', '00:00', 'kwh', '2general', '0.00800' ],
                    [ '2023-01-01', '00:00', 'kwh', '5system', '0.05400' ],
                    [ '2023-01-01', '00:00', 'kwh', '6transm', '0.05800' ],
                    [ '2023-01-01', '00:00', 'kwh', '8radc', '0.17010' ],
                    [ '2023-01-01', '06:00', 'kwh', '8radc', '0.51030' ],
                    [ '2023-01-01', '17:00', 'kwh', '8radc', '1.53080' ],
                    [ '2023-01-01', '21:00', 'kwh', '8radc', '0.51030' ],
                    [ '2023-01-01', '00:00', 'month', '9subsc', '21.00' ],

                    [ '2023-02-01', '00:00', 'kwh', '2general', '0.00800' ],
                    [ '2023-02-01', '00:00', 'kwh', '5system', '0.05400' ],
                    [ '2023-02-01', '00:00', 'kwh', '6transm', '0.05800' ],
                    [ '2023-02-01', '00:00', 'kwh', '8radc', '0.18370' ],
                    [ '2023-02-01', '06:00', 'kwh', '8radc', '0.55110' ],
                    [ '2023-02-01', '17:00', 'kwh', '8radc', '1.65330' ],
                    [ '2023-02-01', '21:00', 'kwh', '8radc', '0.55110' ],
                    [ '2023-02-01', '00:00', 'month', '9subsc', '44.75' ],

                    [ '2023-03-01', '00:00', 'kwh', '2general', '0.00800' ],
                    [ '2023-03-01', '00:00', 'kwh', '5system', '0.05400' ],
                    [ '2023-03-01', '00:00', 'kwh', '6transm', '0.05800' ],
                    [ '2023-03-01', '00:00', 'kwh', '8radc', '0.15090' ],
                    [ '2023-03-01', '06:00', 'kwh', '8radc', '0.45280' ],
                    [ '2023-03-01', '17:00', 'kwh', '8radc', '1.35840' ],
                    [ '2023-03-01', '21:00', 'kwh', '8radc', '0.45280' ],
                    [ '2023-03-01', '00:00', 'month', '9subsc', '44.75' ],

                    [ '2023-04-01', '00:00', 'kwh', '2general', '0.00800' ],
                    [ '2023-04-01', '00:00', 'kwh', '5system', '0.05400' ],
                    [ '2023-04-01', '00:00', 'kwh', '6transm', '0.05800' ],
                    [ '2023-04-01', '00:00', 'kwh', '8radc', '0.15090' ],
                    [ '2023-04-01', '06:00', 'kwh', '8radc', '0.22640' ],
                    [ '2023-04-01', '17:00', 'kwh', '8radc', '0.58870' ],
                    [ '2023-04-01', '21:00', 'kwh', '8radc', '0.22640' ],
                    [ '2023-04-01', '00:00', 'month', '9subsc', '44.75' ],

                    [ '2023-07-01', '00:00', 'kwh', '2general', '0.69700' ],
                    [ '2023-07-01', '00:00', 'kwh', '5system', '0.05400' ],
                    [ '2023-07-01', '00:00', 'kwh', '6transm', '0.05800' ],
                    [ '2023-07-01', '00:00', 'kwh', '8radc', '0.15090' ],
                    [ '2023-07-01', '06:00', 'kwh', '8radc', '0.22640' ],
                    [ '2023-07-01', '17:00', 'kwh', '8radc', '0.58870' ],
                    [ '2023-07-01', '21:00', 'kwh', '8radc', '0.22640' ],
                    [ '2023-07-01', '00:00', 'month', '9subsc', '44.75' ],

                    [ '2023-10-01', '00:00', 'kwh', '2general', '0.69700' ],
                    [ '2023-10-01', '00:00', 'kwh', '5system', '0.05400' ],
                    [ '2023-10-01', '00:00', 'kwh', '6transm', '0.05800' ],
                    [ '2023-10-01', '00:00', 'kwh', '8radc', '0.12150' ],
                    [ '2023-10-01', '06:00', 'kwh', '8radc', '0.36450' ],
                    [ '2023-10-01', '17:00', 'kwh', '8radc', '1.09340' ],
                    [ '2023-10-01', '21:00', 'kwh', '8radc', '0.36450' ],
                    [ '2023-10-01', '00:00', 'month', '9subsc', '44.75' ],

                    [ '2024-01-01', '00:00', 'kwh', '2general', '0.76100' ],
                    [ '2024-01-01', '00:00', 'kwh', '5system', '0.05100' ],
                    [ '2024-01-01', '00:00', 'kwh', '6transm', '0.07400' ],
                    [ '2024-01-01', '00:00', 'kwh', '8radc', '0.12150' ],
                    [ '2024-01-01', '06:00', 'kwh', '8radc', '0.36450' ],
                    [ '2024-01-01', '17:00', 'kwh', '8radc', '1.09340' ],
                    [ '2024-01-01', '21:00', 'kwh', '8radc', '0.36450' ],
                    [ '2024-01-01', '00:00', 'month', '9subsc', '48.00' ],

                    [ '2024-04-01', '00:00', 'kwh', '2general', '0.76100' ],
                    [ '2024-04-01', '00:00', 'kwh', '5system', '0.05100' ],
                    [ '2024-04-01', '00:00', 'kwh', '6transm', '0.07400' ],
                    [ '2024-04-01', '00:00', 'kwh', '8radc', '0.12150' ],
                    [ '2024-04-01', '06:00', 'kwh', '8radc', '0.18220' ],
                    [ '2024-04-01', '17:00', 'kwh', '8radc', '0,47380' ],
                    [ '2024-04-01', '21:00', 'kwh', '8radc', '0.18220' ],
                    [ '2024-04-01', '00:00', 'month', '9subsc', '48.00' ],
                ];
                this.post = new Map();
                if (profile == 'elfexcl' || profile == 'elfincl')  {
                    for (let i = 0; i < lines.length; i++) {
                        let j = metering_point_id + '_' + i;
                        let [dv, bv, iv, tv, pv] = lines[i];
                        if (profile == 'elfexcl' && tv == '2general') {
                            pv = '0.008';
                        }
                        this.post.set('dk_' + j, dv);
                        this.post.set('bk_' + j, bv);
                        this.post.set('ik_' + j, iv);
                        this.post.set('tk_' + j, tv);
                        this.post.set('pk_' + j, pv);
                    }
                }
            }
            let charges = {};
            for (let [key, val] of this.post) {
                // console.log(key + ': ' + val);
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
                let prefix = key.substring(0, 3);
                if (prefix == 'dk_' && val !== '') {
                    if (!val.match(/^\d\d\d\d-\d\d-\d\d/)) {
                        this.error = 'Datoformat skal være åååå-mmm-dd';
                        return;
                    }
                    let sort_key = '';
                    for (let prefix of ['dk_', 'tk_', 'bk_', 'ik_']) {
                        let k = key.replace('dk_', prefix);
                        sort_key += this.post.get(k) + ' ';
                    }
                    let k = key.replace('dk_', 'pk_');
                    let v = this.post.get(k);
                    v = 0 + v.replace(',', '.');
                    v = parseFloat(v).toString();
                    v = Math.round(v * 1000000) / 1000000;
                    v = v.toString().replace('.', ',');
                    charges[sort_key] = v;
                }
            }
            let keys = Object.keys(charges).sort();
            let data = {};
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                let value = charges[key];
                let d = data;
                let ix = key.split(' ');
                for (let j = 0; j < ix.length; j++) {
                    let k = ix[j];
                    if (j == ix.length - 2) {
                        d[k] = value;
                        break;
                    }
                    if (!d[k]) {
                        d[k] = {};
                    }
                    d = d[k];
                }
            }
            this.SetStorage('charge_' + metering_point_id, data);
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

    InputSelectCell(tr, name, value, options) {
        let td = tr.Td();
        let select = td.Select();
        select.class('form-select');
        select.name(name);
        for (let option of options) {
            let key;
            let val;
            if (Array.isArray(option)) {
                [key, val] = option;
            } else {
                key = val = option;
            }
            option = select.Option(key);
            option.value(val);
            if (val == value) {
                option.selected('true');
            }
        }
        return select;
    }

    InputCell(tr, name, value, text = null) {
        let td = tr.Td();
        let input = td.Input();
        input.class('form-control');
        input.name(name);
        input.type('text');
        input.value(value);
        input.size('10');
        if (text) {
            td.Div(text).class('form-text');
        }
        return input;
    }

    InputRow(table, j, dk = '', bk = '', ik = '', tk = '', tv = '') {
        let b_options = [];
        for (let i = 0; i < 24; i++) {
            let val = ('0' + i).slice(-2) + ':00';
            b_options.push(val);
        }
        let i_options = [
            [ 'Pr. kWh', 'kwh' ],
            [ 'Pr. dag', 'day' ],
            [ 'Pr. måned', 'month' ]
        ];
        let t_options = [
            [ 'Netselskab Radius C', '8radc' ],
            [ 'Elafgift', '2general' ],
            [ 'Balancetarif', '3balance' ],
            [ 'PSO-tarif', '4pso' ],
            [ 'Systemtarif', '5system' ],
            [ 'Transmissionsnetafgift', '6transm' ],
            [ 'Abonnement', '9subsc' ]
        ];
        let tr = table.Tr();
        this.InputCell(tr, 'dk_' + j, dk);  // Date
        this.InputSelectCell(tr, 'bk_' + j, bk, b_options);  // Time
        this.InputSelectCell(tr, 'ik_' + j, ik, i_options);  // Interval
        this.InputSelectCell(tr, 'tk_' + j, tk, t_options);  // Type
        this.InputCell(tr, 'pk_' + j, tv);  // Price
    }

    Contents(body, title = '') {
        // console.log(this.GetStorage('metering_points'));
        let div = super.Contents(body, 'Indstillinger');
        this.InputField(div, 'Refresh token', 'refresh_token');
        this.InputSelect(
            div,
            'price_area',
            [ 'DK1', 'DK2' ],
            'Prisområde (DK1/DK2)',
            'DK1 er Danmark vest, DK2 er Danmark øst'
        );
        let metering_point_id = this.GetStorage('metering_point_id', '');
        let metering_points = this.GetStorage('metering_points');
        if (metering_points.length) {
            this.InputSelect(
                div,
                'metering_point_id',
                metering_points,
                'Målepunkt'
            );
        }
        div.H2('Omkostninger i kr. ekskl. moms').class('text-center');
        div.Br();
        let profiles = [
            [ 'Nulstil', 'blank' ],
            [ 'Elforbundet med elafgift', 'elfincl' ],
            [ 'Elforbundet uden elafgift', 'elfexcl' ],
        ];
        this.InputSelect(div, 'profile', profiles, 'Profil');
        let rdiv = div.Last('div');
        rdiv.First('div').class('col-sm-4');
        let bdiv = rdiv.Div();
        bdiv.class('col-sm-3');
        let button = this.SubmitButton(bdiv, 'Brug data for profil', 'profile');
        button.class('btn-secondary');
        let table = div.Table();
        table.class('charges');
        let tr = table.Tr();
        tr.class('text-center');
        let th = tr.Th('Startdato');
        th = tr.Th('Tidspunkt');
        th = tr.Th('Interval');
        th = tr.Th('Type');
        th = tr.Th('Pris');
        let data = this.GetStorage('charge_' + metering_point_id);
        let j = 0;
        for (let [dk, dv] of Object.entries(data)) {
            for (let [tk, tv] of Object.entries(dv)) {
                for (let [bk, bv] of Object.entries(tv)) {
                    for (let [ik, iv] of Object.entries(bv)) {
                        this.InputRow(table, j++, dk, bk, ik, tk, iv);
                    }
                }
            }
        }
        this.InputRow(table, j++);
        div.Br();
        div.P(`
            Startdatoen angiver starten af perioden.
            Perioden stopper, når næste startdato er den aktuelle`
        );
        this.SubmitButton(div);
        button = this.SubmitButton(div, 'Nulstil midlertidige data', 'tmp');
        button.class('btn btn-warning');
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
