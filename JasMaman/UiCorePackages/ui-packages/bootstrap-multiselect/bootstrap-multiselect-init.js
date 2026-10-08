$(function () {
    $(".multiselect").each(function () {
        var $this = $(this);
        var fieldText = $this.data("nonSelectedText");
        $this.multiselect({
            nonSelectedText: fieldText,
            selectAllText: $this.data("selectAllText"),
            //maxHeight: 300,
            includeSelectAllOption: [true, "True", "true"].includes($this.data("includeSelectAllOption")),
            enableClickableOptGroups: true,
            enableCollapsibleOptGroups: true,
            collapseOptGroupsByDefault: true,
            enableFiltering: [true, "True", "true"].includes($this.data("enableFiltering")),
            enableCaseInsensitiveFiltering: [true, "True", "true"].includes($this.data("enableFiltering")),
            filterPlaceHolder: $this.data("filterPlaceHolder"),
            buttonClass: $this.data("cssClass"),
            buttonTextAlignment: 'left',
            buttonWidth: '100%',
            buttonText: function (options, select) {
                if (options.length === 0) {
                    return fieldText;
                }
                else if (options.length > 3) {
                    return [$this.data("selectedItemsText"), ' (', options.length, ')'].join('');
                }
                else {
                    var labels = [];
                    options.each(function () {
                        if ($(this).attr('label') !== undefined) {
                            labels.push($(this).attr('label'));
                        }
                        else {
                            labels.push($(this).html());
                        }
                    });
                    return labels.join(', ') + '';
                }
            },
            enableHTML: [true, "True", "true"].includes($this.data("enableHtml"))
        });
    });
    $(".singleselect").each(function () {
        var $this = $(this);
        $this.multiselect({
            //maxHeight: 300,
            buttonClass: $this.data("cssClass"),
            buttonTextAlignment: 'left',
            buttonWidth: '100%',
            enableCollapsibleOptGroups: true,
            collapseOptGroupsByDefault: true,
            enableFiltering: [true, "True", "true"].includes($this.data("enableFiltering")),
            enableCaseInsensitiveFiltering: [true, "True", "true"].includes($this.data("enableFiltering")),
            filterPlaceHolder: $this.data("filterPlaceHolder"),
            enableHTML: [true, "True", "true"].includes($this.data("enableHtml"))
        });
    });
});
