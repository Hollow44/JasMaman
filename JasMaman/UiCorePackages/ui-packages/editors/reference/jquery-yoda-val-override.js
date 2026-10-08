(function ($) {
    var originalVal = $.fn.val;
    $.fn.val = function (value) {
        if (typeof value == 'undefined') {
            return originalVal.call(this);
        } else {
            if (this.hasClass("ref-plain-select")) {
                this.attr("ref-initial-selected-val", value);
            }
            return originalVal.call(this, value);
        }
    };
})(jQuery);