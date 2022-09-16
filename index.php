<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

include("page.php");

class Index extends Page
{
    public function Contents($body, $title = '')
    {
        $div = parent::Contents($body, 'Elforbrug');
        $div->Div('
            Her kan du se hvad dit faktiske forbrug har været baseret
            på timer, dage, måneder, kvartaler eller år.<br><br>
            Dette gøres ved at udtrække spotpriser fra energidataservice.dk
            og forbrug (pr. time) fra eloverblik.dk.<br><br>
            De felter, der udfyldes under "indstillinger" gemmes
            i cookies lokalt i din browser.<br><br>
            Du kan downloade og installere koden fra GitHub:');
        $url = 'https://github.com/Gitdyr/elforbrug';
        $div->A($url)->href($url);
    }
}

$page = new Index();
$page->Display();

?>
