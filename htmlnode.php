<?php

/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class HtmlNode {
    private $nodes = array();
    private $attributes = array();
    private $void = array(
        'area',
        'base',
        'br',
        'col',
        'command',
        'embed',
        'hr',
        'img',
        'input',
        'keygen',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr'
    );
    private $indent = '';

    public function __construct($parent = null, $tag = 'html', $text ='')
    {
        if ($parent && $tag == 'html') {
            die('HTML tag cannot have a parent');
        }
        $this->parent = $parent;
        $this->tag = $tag;
        $this->text = $text;
    }

    public function __call($name, $args)
    {
        $val = reset($args);
        if (ctype_upper($name[0])) {
            // New node
            $tag = lcfirst($name);
            $node = new self($this, $tag, $val);
            $node->indent = $this->indent.'  ';
            $this->nodes[] = $node;
            return $node;
        } else {
            // New attribute
            $this->attributes[$name][] = $val;
            return null;
        }
    }

    public function First($tag)
    {
        $found = null;
        foreach ($this->nodes as $node) {
            if ($node->tag == $tag) {
                $found = $node;
                break;
            }
        }
        return $found;
    }
    
    public function Last($tag)
    {
        $found = null;
        foreach ($this->nodes as $node) {
            if ($node->tag == $tag) {
                $found = $node;
            }
        }
        return $found;
    }
    
    public function Clone($text = '')
    {
        $node = clone $this;
        $node->text = $text;
        $this->parent->nodes[] = $node;
        return $node;
    }
    
    public function Display()
    {
        if ($this->tag == 'html') {
            header('Content-Type: text/html;charset=UTF-8');
            print "<!DOCTYPE html>\n";
        }
        if ($this->attributes) {
            printf("%s<%s", $this->indent, $this->tag);
            foreach ($this->attributes as $key => $vals) {
                printf(' %s="%s"', $key, implode(' ', $vals));
            }
            printf(">\n");
        } else {
            printf("%s<%s>\n", $this->indent, $this->tag);
        }
        if ($this->text !== '') {
            printf("%s  %s\n", $this->indent, $this->text);
        }
        foreach ($this->nodes as $node) {
            $node->Display();
        }
        if (!in_array($this->tag, $this->void)) {
            printf("%s</%s>\n", $this->indent, $this->tag);
        }
    }

    public function Attributes()
    {
        return $this->attributes;
    }
}

?>
