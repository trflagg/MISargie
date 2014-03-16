module.exports = function(db, collectionName) {
    var util = require('util'),
        async = require('async'),
        Model = require('argieDb/model')(db),
        collectionName = collectionName || 'bNum';


    BNum = function(doc) {
        BNum.super_.call(this, doc);

        if (doc !== undefined) {

            if (doc === null) {
                throw 'BNum load error. doc not found';
            }
            // load from doc
            this._value = doc.value;
        }
        else {
            // make new BNum
            this._value = 0.0;
        }
    }
    util.inherits(BNum, Model);

    BNum.prototype.onSave = function(bNum) {
        // validate number
        if (bNum._value >= 1) {
            throw 'BNum save validation failed: value >= 1!';
        }
        if (bNum._value <= -1) {
            throw 'BNum save validation failed: value <= -1!';
        }

        var doc = BNum.super_.prototype.onSave(bNum);

        doc.value = bNum._value;

        return doc;
    };

    BNum.prototype.setValue = function(value) {
        this._value = value;
        return this;
    }
    BNum.prototype.getValue = function() {
        return this._value;
    }

    BNum.prototype.addBNum = function(amount) {
        var currentVal = this._value;

        if (currentVal > 0) {
            this._value = ((1 - currentVal) * amount) + currentVal;
        }
        else {
            this._value = ((1 + currentVal) * amount) + currentVal;
        }
    }
    db.register('bNum', BNum);

    return BNum;
};
