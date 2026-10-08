$(document).ready(function () {

    $(".yoda-text-array-picker").each(function () {

        var $this = $(this);
        var name = $this.data("original-name");
        var $input = $(`input[ name = "${name}" ]`);
        var $badges = $(`#${name}Badges`);

        var readonly = $this.data("array-readonly");
        var separator = $this.data("array-separator");
        var format = $this.data("array-format");
        var trimeachitem = $this.data("array-trimeachitem") == "True";
        var value = $this.data("array-value");

        if (value != null && value.length > 0) {
            var items = value.split(separator);
            var index = 0;
            items.forEach(function (item) {
                var badgeClass = "badge-success";
                if (format != null && format.length > 0) {
                    if (!textValid(format, item)) {
                        badgeClass = "badge-danger";
                    }
                }
                $badges.append(`<span class='font-14 mr-1 mb-1 badge ${badgeClass}'>${item}${readonly ? `<span class='text-picker-item-remove ml-1 mdi mdi-close' data-item-input='input[ name = "${name}" ]' data-item-index='${index++}'></span>` : ``}</span>`);
            });

            $(`.text-picker-item-remove[ data-item-input="${name}" ]`).on("click", function () {
                var $item = $(this);
                var name = $item.data('item-input');
                var $iteminput = $(`input[ name = "${name}" ]`);
                var itemindex = $item.data('item-index');
                var value = $iteminput.val();
                var items = value.split(separator);
                items.splice(itemindex, 1);
                $iteminput.val(items.join(separator));
                $iteminput.trigger("input");
            });
        }

        if (!readonly) {
            $input.on("input", function () {
                var $input = $(this);
                var value = $input.val();
                var items = value.split(separator);
                $badges.empty();

                if (value.length > 0) {
                    if (trimeachitem) {
                        var trimedItems = [];
                        var index = 0;
                        items.forEach(function (item) {
                            if (item != '' && item.trim() != '' && index != items.length - 1) {
                                item = item.trim();
                            }
                            if ((index < items.length - 1 && item.trim() != '') || (index == items.length - 1)) {
                                trimedItems.push(item);
                            }
                            index++;
                        });
                        items = trimedItems;
                        var newValue = items.join(separator);
                        if (value != newValue) {
                            $input.val(newValue);
                        }
                    }

                    var index = 0;
                    items.forEach(function (item) {
                        if (trimeachitem) {
                            item = item.trim();
                        }
                        var badgeClass = "badge-success";
                        if (format != null && format.length > 0) {
                            if (!textValid(format, item)) {
                                badgeClass = "badge-danger";
                            }
                        }
                        $badges.append(`<span class='font-14 mr-1 mb-1 badge ${badgeClass}'>${item}<span class='text-picker-item-remove ml-1 mdi mdi-close' data-item-input='${name}' data-item-index='${index++}'></span></span>`);
                    });

                    $(`.text-picker-item-remove[ data-item-input="${name}" ]`).on("click", function () {
                        var $item = $(this);
                        var name = $item.data('item-input');
                        var $iteminput = $(`input[ name = "${name}" ]`);
                        var itemindex = $item.data('item-index');
                        var value = $iteminput.val();
                        var items = value.split(separator);
                        items.splice(itemindex, 1);
                        $iteminput.val(items.join(separator));
                        $iteminput.trigger("input");
                    });
                }
            });
        }
    });

});


function textValid(regex, text) {
    var result = text.match(new RegExp(regex));
    if (result != null && result.indexOf(text) > -1) {
        return true;
    }
    return false;
}