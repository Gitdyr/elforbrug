<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL | E_STRICT);

include('htmlnode.php');

class Page {
    public $debug = false;
    public $error = false;
    public $info = false;
    public $charge_count = 10;

    public function Header()
    {
        $bpath = 'bootstrap';
        $head = $this->html->Head();
        $meta = $head->Meta();
        $meta->name("viewport");
        $meta->content("width=device-width, initial-scale=1");
        $head->Title('Elforbrug');
        $link = $head->Link();
        $link->rel('stylesheet');
        $link->href($bpath.'/css/bootstrap.min.css');
        $link = $head->Link();
        $link->rel('stylesheet');
        $link->href('style.css');
        $head->Script()->src($bpath.'/js/bootstrap.min.js');
    }

    public function Item($ul, $name, $href = null)
    {
        $dropdown = in_array('dropdown-menu', $ul->Attributes()['class']);
        if ($href == null) {
            $href = strtolower($name).'.php';
        }
        $li = $ul->Li();
        if (!$dropdown) {
            $li->class('nav-item');
        }
        $a = $li->A($name);
        if ($dropdown) {
            $a->class('dropdown-item');
        } else {
            $a->class('nav-link');
        }
        $a->href($href);
        if ($href == basename($_SERVER['SCRIPT_FILENAME'])) {
            $a->class('active');
        }
        return $li;
    }

    public function Dropdown($ul, $name)
    {
        $li = $ul->Li();
        $li->class('nav-item dropdown');
        $a = $li->A($name);
        $a->class('nav-link dropdown-toggle');
        $a->href('#');
        $a->role('button');
        $a->{'data-bs-toggle'}('dropdown');
        $a->{'aria-expanded'}('false');
        $ul = $li->Ul();
        $ul->class('dropdown-menu');
        return $ul;
    }

    public function SetCookie($key, $val)
    {
        // Save cookie for more than one year
        setcookie($key, $val, time() + 0x2000000);
        $_COOKIE[$key] = $val;
    }

    public function HandlePost()
    {
        if ($_POST) {
            if (!empty($_GET['debug'])) {
                $this->debug = true;
            }
            foreach ($_POST as $key => $val) {
                $this->SetCookie($key, $val);
            }
        }
    }

    public function Get($var, $default = '')
    {
        if (empty($_GET[$var])) {
            $val = $default;
        } else {
            $val = $_GET[$var];
            $val = htmlspecialchars($val);
        }
        return $val;
    }

    public function InputField($div, $title, $name = null, $text = null)
    {
        if ($name == null) {
            $name = strtolower($title);
        }
        $div = $div->Div();
        $div->class('row mb-3');
        $label = $div->Label($title);
        $label->class('col-sm-4 col-form-label');
        $label->class('text-right');
        $idiv = $div->Div();
        $idiv->class('col-sm-8');
        $input = $idiv->Input();
        $input->class('form-control');
        $input->name($name);
        $input->type('text');
        $input->value($this->Cookie($name));
        if ($text) {
            $idiv->Div($text)->class('form-text');
        }
        return $input;
    }

    public function InputSelect($div, $title, $options, $name = null, $text = null)
    {
        if ($name == null) {
            $name = strtolower($title);
        }
        $div = $div->Div();
        $div->class('row mb-3');
        $label = $div->Label($title);
        $label->class('col-sm-4 col-form-label');
        $label->class('text-right');
        $idiv = $div->Div();
        $idiv->class('col-sm-3');
        $select = $idiv->Select();
        $select->class('form-select');
        $select->name($name);
        foreach ($options as $option_text) {
            $option = $select->Option($option_text);
            $option->value($option_text);
            if ($option_text == $this->Cookie($name)) {
                $option->selected('true');
            }
        }
        if ($text) {
            $idiv->Div($text)->class('form-text');
        }
        return $select;
    }

    public function InputCell($tr, $name = null, $text = null)
    {
        $td = $tr->Td();
        $input = $td->Input();
        $input->class('form-control');
        $input->name($name);
        $input->type('text');
        $input->value($this->Cookie($name));
        $input->size('10');
        if ($text) {
            $td->Div($text)->class('form-text');
        }
        return $td;
    }

    public function SubmitButton($div)
    {
        $button = $div->Button('Gem');
        $button->type('submit');
        $button->class('btn btn-primary float-end');
    }

    public function Navigation($body)
    {
        $header = $body->Header();
        $nav = $header->Nav();
        $nav->class('navbar navbar-expand-sm navbar-dark bg-dark');
        $div = $nav->Div();
        $div->class('container-fluid');
        $a = $div->A('Elforbrug');
        $a->class('navbar-brand');
        $a->href('index.php');
        $ul = $div->Ul();
        $ul->class('navbar-nav me-auto');

        $dd = $this->Dropdown($ul, 'Udgift');
        $this->Item($dd, 'Timer', 'hour.php');
        $this->Item($dd, 'Dage', 'day.php');
        $this->Item($dd, 'Måneder', 'month.php');
        $this->Item($dd, 'Kvartaler', 'quarter.php');
        $this->Item($dd, 'År', 'year.php');
        // $this->Item($ul, 'Afgifter', 'charges.php');

        $dd = $this->Dropdown($ul, 'Forbrug');
        $this->Item($dd, 'Timer', 'm_hour.php');
        $this->Item($dd, 'Dage', 'm_day.php');
        $this->Item($dd, 'Måneder', 'm_month.php');
        $this->Item($dd, 'Kvartaler', 'm_quarter.php');
        $this->Item($dd, 'År', 'm_year.php');

        $dd = $this->Dropdown($ul, 'Pris');
        $this->Item($dd, 'Timer', 's_hour.php');
        $this->Item($dd, 'Dage', 's_day.php');
        $this->Item($dd, 'Måneder', 's_month.php');
        $this->Item($dd, 'Kvartaler', 's_quarter.php');
        $this->Item($dd, 'År', 's_year.php');

        $this->Item($ul, 'Målepunkter', 'points.php');

        $ul = $div->Ul();
        $ul->class('navbar-nav');
        $this->Item($ul, 'Indstillinger', 'settings.php');
    }

    public function Alert($body)
    {
        if ($this->error) {
            $div = $body->Div();
            $div->class('card mx-auto alert alert-danger w-50');
            $div = $div->Div();
            $div->class('card-body');
            $div->Div($this->error);
        } elseif ($this->info) {
            $div = $body->Div();
            $div->class('card mx-auto alert alert-success w-50');
            $div = $div->Div();
            $div->class('card-body');
            $div->Div($this->info);
        }
    }

    public function Result($body)
    {
        if (!empty($this->response)) {
            $div = $body->Div();
            $div->class('card ms-2 me-2');
            $div = $div->Div();
            $div->class('card-body');
            $div->H5('Results')->class('card-title');
            $table = $div->Table();
            $table->class('table');
            $tr = $table->Tr();
            $tr->Th('index');
            foreach ($this->fields as $field) {
                $tr->Th($field);
            }
            foreach ($this->response as $key => $row) {
                $tr = $table->Tr();
                $tr->Td($key);
                foreach ($this->fields as $field) {
                    $val = @$row[$field];
                    if (is_array($val)) {
                        $val = sprintf('[%s]', implode(', ', $val));
                    }
                    $val = str_replace("\n", '<br>', $val);
                    $tr->Td($val);
                }
            }
        }
    }

    public function Contents($body, $title = '')
    {
        $form = $body->Form();
        $form->method('post');
        $div = $form->Div();
        $div->class('card mx-3 mx-auto');
        $div->style('width: fit-content');
        $div = $div->Div();
        $div->class('card-body bg-light');
        $div->H1($title)->class('text-center');
        return $div;
    }

    public function Body()
    {
        $body = $this->html->Body();
        $this->Navigation($body);
        $this->Alert($body);
        $this->Contents($body);
    }

    public function Display()
    {
        session_start();
        $this->RefreshToken();
        $this->HandlePost();
        $this->html = new HtmlNode();
        $this->Header();
        $this->Body();
        if (empty($this->display_off)) {
            $this->html->Display();
        }
    }

    public function Dump($data)
    {
        printf("<pre>%s</pre>\n", print_r($data, true));
    }

    public function Cookie($name)
    {
        if (isset($_COOKIE[$name])) {
            $val = $_COOKIE[$name];
        } else {
            $val = '';
        }
        $val = htmlspecialchars($val);
        return $val;
    }

    public function DoCurl($url, $data = array(), $method = 'GET', $progress = null)
    {
        $ch = curl_init();
        if ($data && $method == 'GET') {
            $filter = $data['filter'];
            unset($data['filter']);
            $query = http_build_query($data);
            $query .= '&filter='.$filter;
            $url .= '?'.$query;
        }
        if ($data && $method == 'POST') {
            $json = json_encode($data, JSON_UNESCAPED_UNICODE);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        }

        if (isset($this->token)) {
            $header[] = 'Content-type: application/json';
            $header[] = 'Authorization: Bearer '.$this->token;
            curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        }
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        if ($progress) {
            curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, $progress);
            curl_setopt($ch, CURLOPT_NOPROGRESS, false);
        }

        $data = curl_exec($ch);
        if (curl_errno($ch)) {
            $this->info = curl_getinfo($ch);
            $error = curl_error($ch);
            if ($error) {
                $this->error = $error;
            } else {
                $this->error = "Connection failed";
            }
            curl_close($ch);
            return false;
        } else {
            curl_close($ch);
            return $data;
        }
    }

    public function RefreshToken()
    {
        $this->token = $this->Cookie('token');
        if (!$this->token) {
            $this->token = $this->Cookie('refresh_token');
            if ($this->token) {
                $url = 'https://api.eloverblik.dk/customerapi/api/token';
                $json = $this->DoCurl($url);
                if ($json) {
                    if ($json) {
                        $res = json_decode($json);
                        $this->token = $res->result;
                        setcookie('token', $this->token, time() + 24 * 3600);
                    }
                }
            }
        }
    }

    public function Number($val)
    {
        $val = round($val * 100);
        return sprintf("%d,%02d", intdiv($val, 100), $val % 100);
    }
}

?>
