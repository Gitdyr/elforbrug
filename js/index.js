/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Index extends Page {
    Contents(body, title = '') {
        let div = super.Contents(body, 'Elforbrug');
        div.P(`
            Her kan du se hvad dit faktiske forbrug har været baseret
            på timer, dage, måneder, kvartaler eller år.`);
        div.P(`
            Dette gøres ved at udtrække spotpriser fra energidataservice.dk
            og forbrug (pr. time) fra eloverblik.dk.`);
        div.P(`
            Refresh token, diverse indstillinger og midlertidig data,
            gemmes lokalt i din browser.`);
        let url = 'https://github.com/Gitdyr/elforbrug';
        div.P(`
            Du kan downloade og installere koden fra GitHub:
            <a href='${url}'>${url}</a>.`);
        url = 'https://eloverblik.dk/';
        let button = div.Button();
        button.Image().src('img/caret-down-fill.svg');
        button.type('button');
        button.class('btn btn-secondary float-end');
        button['data-bs-toggle']('collapse');
        button['data-bs-target']('#instructions');
        div = div.Div();
        div.class('collapse');
        div.id('instructions');
        div.P();
        div.P(`
            For at kunne hente målerdata, skal du logge ind hos:
            <a href='${url}'>${url}</a>.`);
        div.P('Klik på ikonet i øverste højre hjørne og vælg "Datadeling".');
        div.P();
        let img = div.Img();
        img.src('eloverblik1.png');
        img.class('img-fluid mx-auto d-block rounded');
        div.P();
        div.P(`
            Følg vejledningen og opret et refresh token. Start
            værktøjet og klik på "Indstillinger".<br>Her angives det
            refresh token, du fik fra eloverblik.dk.`);
    }
}

window.index = new Index();
