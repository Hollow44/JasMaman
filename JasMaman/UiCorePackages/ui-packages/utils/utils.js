var Utils = {
    dateToString: dateToString,
    dateToInputDateValue: dateToInputDateValue,
    padLeft: strPadLeft,
    genId: makeid
};

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    text = text + Date.now();
    return text;
}
function strPadLeft(nr, n, str) {
    var s = nr + "", c = str || '0';
    while (s.length < n) s = c + s;
    return s;
}
function dateToString(date) {
    return strPadLeft(date.getDate().toString(), 2, '0') + "."
        + strPadLeft((date.getMonth() + 1).toString(), 2, '0') + "."
        + strPadLeft(date.getFullYear(), 4, '0');
}

function dateToInputDateValue(date) {
    return strPadLeft(date.getFullYear(), 4, '0') + "-"
        + strPadLeft((date.getMonth() + 1).toString(), 2, '0') + "-"
        + strPadLeft(date.getDate().toString(), 2, '0');
}


// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },
        configurable: true,
        writable: true
    });
}



// Шаги алгоритма ECMA-262, 5-е издание, 15.4.4.17
// Ссылка (en): http://es5.github.io/#x15.4.4.17
// Ссылка (ru): http://es5.javascript.ru/x15.4.html#x15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (fun/*, thisArg*/) {
        'use strict';

        if (this == null) {
            throw new TypeError('Array.prototype.some called on null or undefined');
        }

        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(thisArg, t[i], i, t)) {
                return true;
            }
        }

        return false;
    };
}