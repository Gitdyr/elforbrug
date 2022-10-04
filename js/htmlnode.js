/**
 * (c) Kjeld Borch Egevang
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class HtmlNode {
    handler = {
	get: (target, prop) => {
	    if (typeof target[prop] !== 'undefined') {
		return target[prop];
	    }
	    return (val) => {
		let tag = prop.toLowerCase();
                if (tag == 'html') {
                    throw new Error('HTML tag cannot have a parent');
                }
                if (prop == 'Render') {
                    return target.Render();
                } else if (prop == 'Attributes') {
                    return target.Attributes();
                } else if (tag == prop) {
                    // New attribute
                    if (!target.attributes[prop]) {
                        target.attributes[prop] = [];
                    }
                    target.attributes[prop].push(val);
                    return null;
                } else {
                    // New node
                    let node = new HtmlNode(tag, val, target);
                    node.indent = target.indent + '  ';
                    target.nodes.push(node);
                    return node;
                }
	    }
	}
    }
    nodes = [];
    attributes = {};
    void = [
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
    ];
    indent = '';

    constructor(tag = 'html', text = '', parent = null)
    {
        let node = new Proxy(this, this.handler);
        this.parent = parent;
        this.tag = tag;
        this.text = text;
        return node;
    }

    First(tag) {
        let found = null;
        for (const node of this.nodes) {
            if (node.tag == tag) {
                found = node;
                break;
            }
        }
        return found;
    }
    
    Last(tag) {
        let found = null;
        for (const node of this.nodes) {
            if (node.tag == tag) {
                found = node;
            }
        }
        return found;
    }
    
    Render(pretty = false) {
	let indent = this.indent;
	let sp = '  ';
	let nl = '\n';
	if (!pretty) {
	    indent = '';
	    sp = '';
	    nl = '';
	}
        let text = '';
        if (this.tag == 'html') {
            text += '<!DOCTYPE html>' + nl;
        }
        if (this.attributes) {
            text += indent + '<' + this.tag;
            for (const [key, val] of Object.entries(this.attributes)) {
                text += ' ' + key + '="' + val.join(' ') + '"';
            }
            text += '>' + nl;
        } else {
            text += indent + '<' + this.tag + '>' + nl;
        }
        if (this.text !== '') {
            text += indent + sp + this.text;
        }
        for (const node of this.nodes) {
            text += node.Render(pretty);
        }
        if (!this.void.includes(this.tag)) {
            text += indent + '</' + this.tag + '>' + nl;
        }
        return text;
    }

    Display() {
        document.body.innerHTML = this.Render();
    }

    Attributes() {
        return this.attributes;
    }
}
