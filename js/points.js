/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Points extends Page {
    PointsCallback(data, obj) {
        if (data.error) {
            obj.error = data.error;
            obj.Display();
            return;
        }
        let body = obj.html.First('body');
        let div = body.First('form').First('div').First('div');
        for (const result of data.result) {
            let table = div.Table();
            table.class('table mx-auto w-auto');
            for (let [key, val] of Object.entries(result)) {
                let tr = table.Tr();
                tr.Th(key);
                if (Array.isArray(val)) {
                    let td = tr.Td();
                    for (const val2 of val) {
                        let table2 = td.Table();
                        for (const [v, k] of Object.entries(val2)) {
                            let tr2 = table2.Tr();
                            tr2.Th().Small(k);
                            let val = v.replaceAll("\n", '<br>');
                            tr2.Td().Small(val).class('text-break');
                        }
                    }
                    continue;
                }
                console.log(val);
                if (val === null) {
                    val = '';
                } else if (val === true) {
                    val = 'true';
                } else if (val === false) {
                    val = 'false';
                }
                val = val.replaceAll("\n", '<br>');
                tr.Td(val).class('text-break');
            }
        }
        obj.html.Display();
    }

    HandlePost() {
        super.HandlePost();
        if (this.error == false) {
            let token = this.GetStorage('token');
            if (token) {
                let data = {
                    action: 'points',
                    token: token
                };
                this.DoAjax(data, this.PointsCallback);
            }
        }
    }

    Contents(body, title = '') {
        let div = super.Contents(body, 'Målepunkter');
    }
}

window.points = new Points();
