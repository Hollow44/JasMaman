// В отдельном файле, чтобы submit навесился последним (Максимальный вес в коде подключения скрипта)

$(document).ready(function ($) {
    $("form").delegate("input.auto-disabling", "click", function () {
        $("input.auto-disabling", $(this).parents("form")).removeAttr("clicked");
        $(this).attr("clicked", "true");
    });

    $("form").submit(function (e) {
        var $form = $(this);

        if (e.isDefaultPrevented() == true) {
            return;
        }
        var $clickedBtn = $("input.auto-disabling[clicked]");
        if ($clickedBtn.length != 1) {
            return;
        }

        var $buttons = $("input.auto-disabling:enabled");
        $buttons.prop("disabled", true);
        $("input.auto-disabling").removeClass("waiting-submit");

        $clickedBtn.addClass("waiting-submit");

        var btnName = $clickedBtn.attr("name");
        var btnVal = $clickedBtn.val();
        if (btnName == undefined) {
            return;
        }
        var $btnReplacement = $("<input type='hidden' />");
        $btnReplacement.attr("name", btnName);
        $btnReplacement.val(btnVal);
        $form.append($btnReplacement);
    });
});