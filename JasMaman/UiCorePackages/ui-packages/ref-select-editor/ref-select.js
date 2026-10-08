$(function () {
    $(".ref-select").each(function () {
        var $this = $(this);
        var refName = $this.data("ref-name");
        var refGroup = $this.data("ref-group");
        var refLevel = $this.data("ref-level");
        var refApiUrl = $this.data("ref-api-url");
        var curVal = $this.val();

        $this.on("change", (e) => {
            $this.find('option[value=""]').remove();
            document.dispatchEvent(new CustomEvent(
                "ref.value-change",
                {
                    bubbles: false, detail: {
                        refName: refName,
                        refGroup: refGroup,
                        refLevel: refLevel,
                        value: $this.val()
                    }
                })
            );
        });

        $this.on("mousedown", e => {
            if (this.hasAttribute("readonly")) {
                e.preventDefault();
                this.blur();
                window.focus();
            }
        });

        function reloadOptions(parentValue) {
            $.ajax({
                url: refApiUrl,
                data: {
                    RefName: refName,
                    Level: refLevel,
                    ParentValue: parentValue
                },
                success: function (items) {
                    var html = items.map((item) => `<option value='${item.Value}'>${item.Text}</option>`).join();
                    $this.append(html);
                },
                error: function () {
                    console.log("Не удалось загрузить данные справочника");
                }
            });
        }

        document.addEventListener("ref.value-change", (e) => {
            if (e.detail.refName != refName || e.detail.refGroup != refGroup) { //not cur ref group
                return;
            }
            if (e.detail.refLevel >= refLevel) { //not interested in current and lower levels
                return;
            }
            $this.find("option").remove();
            $this.append(`<option value=''>Выберите значение...</option>`);
            if (e.detail.refLevel == refLevel - 1) {
                $this.removeAttr("readonly");
                reloadOptions(e.detail.value);
                // надо почистить и подгрузить следующий уровень и сделать enabled текущего уровня
            } else {
                $this.attr("readonly", true);
                //просто чистим и делаем текущий уровень disabled
            }
        });

        document.addEventListener("ref.value-init", (e) => {
            if (e.detail.refName != refName || e.detail.refGroup != refGroup) { //not cur ref group
                return;
            }
            if (e.detail.refLevel != refLevel - 1) { //only interested in direct parent
                return;
            }
            if (e.detail.value === null || e.detail.value === undefined || e.detail.value === "") {
                $this.attr("readonly", true);
                return;
            }

            if (!curVal && $this.find('option:not([value=""])').length == 0) {
                reloadOptions(e.detail.value);
            }
        });
    });

    $(".ref-select").each(function () {
        var $this = $(this);
        var refName = $this.data("ref-name");
        var refGroup = $this.data("ref-group");
        var refLevel = $this.data("ref-level");
        var curVal = $this.val();

        document.dispatchEvent(new CustomEvent(
            "ref.value-init",
            {
                bubbles: false, detail: {
                    refName: refName,
                    refGroup: refGroup,
                    refLevel: refLevel,
                    value: curVal
                }
            })
        );
    });
});