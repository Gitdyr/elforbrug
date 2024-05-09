/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Page {
    debug = false;
    error = false;
    info = false;
    saved_info = false;
    detail = false;
    post = new Map();

    constructor() {
        let page = this.GetPage();
        if (page == this.constructor.name.toLowerCase()) {
            window.onload = () => this.Display();
        }
    }

    GetPage() {
        let page = this.Get('page');
        if (page) {
            if (page.split('_').length > 1) {
                page = 'meter';
            }
        } else {
            page = 'index';
        }
        return page;
    }

    GetPrefix() {
        let val = this.Get('page').split('_');
        if (val.length > 1) {
            return val[0];
        }
        return '';
    }

    Header() {
        /*
        let head = this.html.Head();
        let meta = head.Meta();
        meta.name('viewport');
        meta.content('width=device-width, initial-scale=1');
        meta = head.Meta();
        meta.charset('UTF-8');
        head.Title('Elforbrug');
        let link = head.Link();
        link.rel('stylesheet');
        link.href('bootstrap/css/bootstrap.min.css');
        link = head.Link();
        link.rel('stylesheet');
        link.href('style.css');
        let script;
        script = head.Script().src('bootstrap/js/bootstrap.min.js');
        script = head.Script().src('js/chart.js');
        script = head.Script().src('js/htmlnode.js');
        script = head.Script().src('js/page.js');
        */
    }

    Item(ul, name, href = null, page = null) {
        let dropdown = ul.Attributes()['class'].includes('dropdown-menu');
        if (href == null) {
            href = name.toLowerCase();
        }
        href += '.html';
        if (page) {
            href += '?page=' + page;
        }
        let li = ul.Li();
        if (!dropdown) {
            li.class('nav-item');
        }
        let a = li.A(name);
        if (dropdown) {
            a.class('dropdown-item');
        } else {
            a.class('nav-link');
        }
        a.href(href);
        if (this.Get('page') == page) {
            a.class('active');
        }
        return li;
    }

    Dropdown(ul, name) {
        let li = ul.Li();
        li.class('nav-item dropdown');
        let a = li.A(name);
        a.class('nav-link dropdown-toggle');
        a.href('#');
        a.role('button');
        a['data-bs-toggle']('dropdown');
        a['aria-expanded']('false');
        ul = li.Ul();
        ul.class('dropdown-menu');
        return ul;
    }

    SetStorage(key, val) {
        this.storage.set(key, val);
    }

    SaveStorage() {
        let storage = Object.fromEntries(this.storage);
        localStorage.setItem('elforbrug', JSON.stringify(storage));
    }

    RestoreStorage() {
        let storage = localStorage.getItem('elforbrug');
        if (storage) {
            storage = JSON.parse(localStorage.getItem('elforbrug'));
            this.storage = new Map(Object.entries(storage));
        } else {
            this.storage = new Map();
        }
    }

    GetStorage(name, def = '') {
        let val = this.storage.get(name);
        if (!val) {
            val = def;
        }
        return val;
    }

    HandlePost() {
        if (this.post.size) {
            if (this.Get('debug')) {
                this.debug = true;
            }
            for (const [key, val] of this.post) {
                this.SetStorage(key, val);
            }
            this.SaveStorage();
        }
    }

    Get(name, def = '') {
        let params = new URLSearchParams(location.search);
        let val = params.get(name);
        if (!val) {
            val = def;
        }
        return val;
    }

    InputField(div, title, name = null, text = null) {
        if (name == null) {
            name = title.toLowerCase();
        }
        div = div.Div();
        div.class('row mb-3');
        let label = div.Label(title);
        label.class('col-sm-4 col-form-label');
        label.class('text-right');
        let idiv = div.Div();
        idiv.class('col-sm-8');
        let input = idiv.Input();
        input.class('form-control');
        input.name(name);
        input.type('text');
        input.value(this.GetStorage(name));
        if (text) {
            idiv.Div(text).class('form-text');
        }
        return input;
    }

    InputSelect(div, name, options, title = null, text = null) {
        if (name == null) {
            name = title.toLowerCase();
        }
        div = div.Div();
        div.class('row mb-3');
        if (title) {
            let label = div.Label(title);
            label.class('col-sm-4 col-form-label');
            label.class('text-right');
        }
        let idiv = div.Div();
        if (title) {
            idiv.class('col-sm-3');
        } else {
            idiv.class('col-sm-7 mx-auto');
        }
        let select = idiv.Select();
        select.class('form-select');
        select.name(name);
        for (let option of options) {
            let key;
            let value;
            if (Array.isArray(option)) {
                [key, value] = option;
            } else {
                key = value = option;
            }
            option = select.Option(key);
            option.value(value);
            if (value == this.GetStorage(name)) {
                option.selected('true');
            }
        }
        if (text) {
            idiv.Div(text).class('form-text');
        }
        return select;
    }

    CheckBox(div, name, text = null) {
        div = div.Div();
        div.class('form-check');
        let checkbox = div.Input();
        checkbox.type('checkbox');
        if (this.GetStorage(name)) {
            checkbox.checked('checked');
        }
        checkbox.name(name);
        checkbox.id(name);
        checkbox.class('form-check-input');
        if (text) {
            let label = div.Label(text);
            label.for(name);
            label.class('form-check-label');
        }
        return checkbox;
    }

    SubmitButton(div, text = 'Gem', name = null) {
        let button = div.Button(text);
        button.type('submit');
        if (name) {
            button.type(name);
        }
        button.class('btn btn-primary');
        return button;
    }

    Navigation(body) {
        let header = body.Header();
        let nav = header.Nav();
        nav.class('navbar navbar-expand-sm navbar-dark bg-dark');
        let div = nav.Div();
        div.class('container-fluid');
        let a = div.A('Elforbrug');
        a.class('navbar-brand nav-link');
        a.href('index.html');
        let ul = div.Ul();
        ul.class('navbar-nav me-auto');

        let dd = this.Dropdown(ul, 'Udgift');
        this.Item(dd, 'Timer', 'index', 'c_hour');
        this.Item(dd, 'Dage', 'index', 'c_day');
        this.Item(dd, 'Måneder', 'index', 'c_month');
        this.Item(dd, 'Kvartaler', 'index', 'c_quarter');
        this.Item(dd, 'År', 'index', 'c_year');
        // this.Item(ul, 'Afgifter', 'charges');

        dd = this.Dropdown(ul, 'Forbrug');
        this.Item(dd, 'Timer', 'index', 'q_hour');
        this.Item(dd, 'Dage', 'index', 'q_day');
        this.Item(dd, 'Måneder', 'index', 'q_month');
        this.Item(dd, 'Kvartaler', 'index', 'q_quarter');
        this.Item(dd, 'År', 'index', 'q_year');

        dd = this.Dropdown(ul, 'Pris');
        this.Item(dd, 'Timer', 'index', 'p_hour');
        this.Item(dd, 'Dage', 'index', 'p_day');
        this.Item(dd, 'Måneder', 'index', 'p_month');
        this.Item(dd, 'Kvartaler', 'index', 'p_quarter');
        this.Item(dd, 'År', 'index', 'p_year');

        this.Item(ul, 'Målepunkter', 'index', 'points');

        ul = div.Ul();
        ul.class('navbar-nav');
        this.Item(ul, 'Indstillinger', 'index', 'settings');
    }

    Alert(body) {
        if (this.error) {
            let div = body.Div();
            div.class('card mx-auto alert alert-danger w-50');
            div = div.Div();
            div.class('card-body');
            div.Div(this.error);
        } else if (this.info) {
            let div = body.Div();
            div.class('card mx-auto alert alert-success w-50');
            div = div.Div();
            div.class('card-body');
            div.Div(this.info);
        }
        if (this.detail) {
            let div = body.Div();
            div.class('card mx-auto alert alert-warning w-50');
            div = div.Div();
            div.class('card-body');
            div.Div(this.detail);
        }
    }

    Result(body) {
        if (!empty(this.response)) {
            let div = body.Div();
            div.class('card ms-2 me-2');
            div = div.Div();
            div.class('card-body');
            div.H5('Results').class('card-title');
            let table = div.Table();
            table.class('table');
            let tr = table.Tr();
            tr.Th('index');
            for (field of this.fields) {
                tr.Th(field);
            }
            for (const [key, row] of Object.entries(this.response)) {
                let tr = table.Tr();
                tr.Td(key);
                for (field of this.fields) {
                    let val = row[field];
                    if (is_array(val)) {
                        val = sprintf('[%s]', implode(', ', val));
                    }
                    val = val.replaceAll('\n', '<br>');
                    tr.Td(val);
                }
            }
        }
    }

    Contents(body, title = '') {
        let form = body.Form();
        form.method('post');
        let div = form.Div();
        div.class('card mx-3 mx-auto');
        div.style('width: fit-content');
        div = div.Div();
        div.class('card-body bg-light');
        div.H1(title).class('text-center');
        for (const name of ['error', 'info']) {
            let input = div.Input();
            input.type('hidden');
            input.name(name);
            input.value(this[name]);
        }
        return div;
    }

    Body() {
        let body = this.html.Body();
        this.Navigation(body);
        this.Alert(body);
        this.Contents(body);
    }

    Submit(e) {
        let inputs = document.querySelectorAll('input,select'); 
        for (let input of inputs) {
            if (input.type == 'checkbox' && !input.checked) {
                this.post.set(input.name, '');
            } else {
                this.post.set(input.name, input.value);
            }
        }
        let submitter = e.submitter.attributes.type.value.split(' ');
        this.post.set('submitter', submitter.slice(-1));
        this.Display();
        e.preventDefault();
    }

    ItemSelected(e) {
        e.preventDefault();
        history.replaceState({}, null, e.target.href);
        let page = this.GetPage();
        this.post = new Map();
        this.error = false;
        this.info = false;
        this.saved_info = false;
        this.detail = false;
        window[page].Display();
    }

    Display() {
        window.onresize = null;
        this.RestoreStorage();
        this.HandlePost();
        this.html = new HtmlNode();
        // this.Header();
        this.Body();
        this.html.Display();
        document.forms[0].addEventListener('submit', (e) => this.Submit(e));
        let items = document.getElementsByTagName('a'); 
        for (let item of items) {
            if (!item.classList.contains('dropdown-toggle')) {
                if (item.classList.contains('dropdown-item') ||
                    item.classList.contains('nav-link'))
                {
                    item.onclick = (e) => this.ItemSelected(e);
                }
            }
        }
        this.saved_info = this.info;
        this.post = new Map();
        this.error = false;
        this.info = false;
        this.detail = false;
    }

    Dump(data) {
        for (const [key, val] of Object.entries(data)) {
            console.log(key + ' => ' + val);
        }
    }

    Sum(data) {
        return data.reduce((s, a) => s + parseFloat(a), 0);
    }

    DoAjax(data = [], load, progress = null) {
        let url;
        let xhttp = new XMLHttpRequest();
        let method = 'GET';
        let eloverblik = 'https://api.eloverblik.dk/customerapi/api';
        let elspot = 'https://api.energidataservice.dk/dataset/Elspotprices';
        let json_data = null;
        console.log('action: ' + data.action);
        if (data.action == 'token') {
            url = eloverblik + '/token';
        } else if (data.action == 'points') {
            url = eloverblik + '/meteringpoints/meteringpoints';
        } else if (data.action == 'quantity') {
            let start = new Date(data.start);
            let stop = new Date(data.stop);
            url = eloverblik + '/meterdata/gettimeseries';
            url += '/' + start.toISOString().substr(0, 10);
            url += '/' + stop.toISOString().substr(0, 10);
            url += '/Hour';
            json_data = JSON.stringify({
                meteringPoints: {
                    meteringPoint: [data.id]
                }
            });
            console.log(json_data);
            method = 'POST';
        } else if (data.action == 'prices') {
            console.log(data);
            let start = new Date(data.start);
            let stop = new Date(data.stop);
            url = new URL(elspot);
            json_data = null;
            url.searchParams.set('offset', 0);
            url.searchParams.set('sort', 'HourUTC asc');
            url.searchParams.set('timezone', 'utc');
            url.searchParams.set('start', start.toISOString().substr(0, 16));
            url.searchParams.set('end', stop.toISOString().substr(0, 16));
            url.searchParams.set('filter', '{"PriceArea":"' + data.area + '"}');
            url = url.href;
        }
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
            }
        };
        console.log({
            url: url,
            method: method,
            json_data: json_data
        });
        xhttp.open(method, url, true);
        xhttp.setRequestHeader('Content-type', 'application/json');
        xhttp.setRequestHeader('Authorization', 'Bearer ' + data.token);
        xhttp.onload = function() {
            let response;
            if (this.responseText) {
                console.log('len=' + this.responseText.length);
                try {
                    response = JSON.parse(this.responseText);
                }
                catch (err) {
                    response = this.responseText;
                }
            } else {
                response = '';
                console.log(this);
            }
            load(response);
        }
        if (progress) {
            xhttp.onprogress = function(e) {
                progress(e, this);
            }
        }
        xhttp.send(json_data);
    }

    TokenCallback(data) {
        if (data.error) {
            this.error = data.error;
            console.log([data.error, data.info]);
            this.SetStorage('token', null);
            this.SetStorage('token_life', Date.now() + 60 * 1000);
            this.SaveStorage();
            this.Display();
        }
        if (data && data.result) {
            this.SetStorage('token', data.result);
            this.SetStorage('token_life', Date.now() + 3600 * 1000);
            this.SaveStorage();
            let call_next = this.call_next;
            if (call_next) {
                delete this.call_next;
                call_next();
            }
        } else {
            console.log('Refresh failed');
        }
    }

    RefreshToken(call_next) {
        let token = this.GetStorage('token');
        let token_life = this.GetStorage('token_life');
        let refresh_token = this.GetStorage('refresh_token');
        if (this.Get('refresh')) {
            token_life = Date.now();
        }
        if (token && token_life && token_life > Date.now()) {
            console.log('No refresh ' + token_life + ' ' + Date.now());
            call_next();
            return;
        }
        if (refresh_token && !token && token_life) {
            this.detail = 'Token kunne ikke allokeres';
        }
        if (refresh_token) {
            console.log('Must refresh ' + token_life + ' ' + Date.now());
            this.call_next = () => call_next();
            let data = {
                action: 'token',
                token: refresh_token
            };
            this.DoAjax(data, (r) => this.TokenCallback(r));
        }
    }

    Number(val) {
        val = round(val * 100);
        return sprintf('%d,%02d', intdiv(val, 100), val % 100);
    }
}
