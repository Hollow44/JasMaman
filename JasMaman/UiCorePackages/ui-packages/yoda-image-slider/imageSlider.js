$(document).ready(function () {
    function redrawImageSliderItems(sliderId) {
        var itemsCount = parseInt($(sliderId).attr("itemsCount"));
        var itemNumber = parseInt($(sliderId).attr("itemNumber"));
        var showItems = [
            (itemNumber - 1) == 0 ? itemNumber + 2 : itemNumber - 1,
            itemNumber,
            (itemNumber + 1) > itemsCount ? itemsCount - 2 : itemNumber + 1
        ];

        for (var index = 1; index <= itemsCount; index++) {
            itemId = `${sliderId}-item-${index}`;
            if (showItems.includes(index)) {
                $(itemId).show();
            } else {
                $(itemId).hide();
            }
        }

    }

    $(".yoda-image-slider").each(function () {
        var sliderId = `#${$(this).attr("id")}`;

        redrawImageSliderItems(sliderId);
    });

    $(".yoda-image-slider-item").click(function () {
        var sliderId = `#${$(this).attr("parent")}`;
        var mainImageId = `${sliderId}-main`;

        var src = $(this).attr("src");
        var itemNumber = $(this).attr("itemNumber");

        $(mainImageId).attr("src", src);
        $(sliderId).attr("itemNumber", itemNumber);

        redrawImageSliderItems(sliderId);
    });

    $(".yoda-image-slider-left").click(function () {
        var sliderId = `#${$(this).attr("parent")}`;
        var mainImageId = `${sliderId}-main`;
        var itemsCount = parseInt($(sliderId).attr("itemsCount"));
        var itemNumber = parseInt($(sliderId).attr("itemNumber"));

        itemNumber = (itemNumber - 1) == 0 ? itemsCount : itemNumber - 1;
        itemId = `#${$(this).attr("parent")}-item-${itemNumber}`;
        var src = $(itemId).attr("src");

        $(mainImageId).attr("src", src);
        $(sliderId).attr("itemNumber", itemNumber);

        redrawImageSliderItems(sliderId);
    });

    $(".yoda-image-slider-right").click(function () {
        var sliderId = `#${$(this).attr("parent")}`;
        var mainImageId = `${sliderId}-main`;
        var itemsCount = parseInt($(sliderId).attr("itemsCount"));
        var itemNumber = parseInt($(sliderId).attr("itemNumber"));

        itemNumber = (itemNumber + 1) > itemsCount ? 1 : itemNumber + 1;
        itemId = `${sliderId}-item-${itemNumber}`;
        var src = $(itemId).attr("src");

        $(mainImageId).attr("src", src);
        $(sliderId).attr("itemNumber", itemNumber);

        redrawImageSliderItems(sliderId);
    });
});