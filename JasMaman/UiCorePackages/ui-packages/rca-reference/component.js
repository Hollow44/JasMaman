$(document).ready(function () {
    $(".rca-reference").each(function () {
        var $this = $(this);
        var name = $this.data("name");
        var readonly = $this.data("readonly") == "True";
        var getArChildsUrl = $this.data("getarchildsurl");
        var getRcaUrl = $this.data("getrcaurl");
        var $selector = $this.find(".rca-reference-selector");
        var $selectorSearch = $("<input type='text' class='form-control mt-1' placeholder='Поиск'>");
        $selectorSearch.appendTo($selector);
        var $selectorItems = $('<div class="childs mt-1"></div>');
        $selectorItems.appendTo($selector);
        var $path = $this.find(".rca-reference-path");

        if (readonly) {
            $selector.hide();
            $.ajax({
                url: getRcaUrl,
                success: function (resultText) {
                    $path.html(resultText);
                },
                error: function (xhr, status) {
                }
            });
        } else {
            var $input = $("<input type='hidden'>");
            $input.attr("name", name);
            $input.val(`{id:1, type:"Ats"}`);
            $this.append($input);

            $selectorSearch.on('input', function () {
                var value = $selectorSearch.val();
                $selectorItems.children(".rca-item-child").each(function () {
                    var $item = $(this);
                    var text = $item.data("text");
                    if (text.toLowerCase().includes(value.toLowerCase()) || value == "") {
                        $item.show();
                    } else {
                        $item.hide();
                    }
                });
            });

            function getArChilds($item) {
                $selectorSearch.val("");
                var id = $item.data("id");
                var type = $item.data("type");
                $input.val(`{id:${id}, type:"${type}"}`);

                if (['Building', 'Ground', 'Pb'].includes(type)) {
                    $path.removeClass("bg-secondary");
                    $path.addClass("bg-success");
                } else {
                    $path.removeClass("bg-success");
                    $path.addClass("bg-secondary");
                }

                $.ajax({
                    type: "POST",
                    url: getArChildsUrl,
                    data: { "GetArChilds": `{id:${id}, type:"${type}"}` },
                    success: function (childs) {
                        $selectorItems.html("");
                        if (childs.length > 0) {
                            $selectorSearch.show();
                            $selectorItems.html(Array.from(childs, child => `<div class="rca-item-child text-secondary border border-secondary rounded m-1 p-1" data-id="${child.id}" data-type="${child.type}" data-text="${child.text}">${child.text}</div>`).join(""));
                        } else {
                            $selectorSearch.hide();
                        }

                        $selectorItems.children(".rca-item-child").each(function () {
                            $(this).click(function () {
                                var $item = $(this);
                                var id = $item.data("id");
                                var type = $item.data("type");
                                var text = $item.data("text");
                                var $pathPart = $(`<div class="rca-item mr-1" data-id="${id}" data-type="${type}" data-text="${text}">${text}</div>`);
                                $pathPart.click(function () {
                                    $(this).nextAll(".rca-item").remove();
                                    getArChilds($(this));
                                });
                                $pathPart.appendTo($path);
                                getArChilds($item);
                            });
                        });
                    },
                    error: function (xhr, status) {
                    }
                });
            }

            var $qazaqstan = $(`<div class="rca-item mr-1" data-id="1", data-type="Ats", data-text="Казахстан">Казахстан</div>`);
            $path.append($qazaqstan);

            $qazaqstan.click(function () {
                $(this).nextAll(".rca-item").remove();
                getArChilds($(this));
            });

            getArChilds($qazaqstan);
        }

    });
});