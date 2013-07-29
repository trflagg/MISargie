module.exports = function() {
    var util = require('util'),
        exports = {};

    exports.Node = function() {
        this.type ='node';
        this,nextSibling = { };
    };

    exports.TextNode = function() {
        exports.TextNode.super_.call(this);
        this.type = 'text';
        this.text = '';
    };
    util.inherits(exports.TextNode, exports.Node);

    exports.CodeNode = function() {
        exports.CodeNode.super_.call(this);
        this.type = 'code';
        this.func = null;
        this.p = [];
    };
    util.inherits(exports.CodeNode, exports.Node);

    return exports;
}();