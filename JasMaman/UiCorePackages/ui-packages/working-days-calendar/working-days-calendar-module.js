$(document).ready(function () {
    $(".working-days-calendar").each(function () {
        var $this = $(this);
        var year = $this.attr("year");
        var notWorkingDaysJs = JSON.parse($this.attr("not-working-days"));
        var notWorkingDays = new Array();
        for (var i = 0; i < notWorkingDaysJs.length; i++) {
            var dateJs = notWorkingDaysJs[i];
            notWorkingDays.push(new Date(dateJs.Year, dateJs.Month-1, dateJs.Day));
        }
        $this.multiDatesPicker({
            addDates: notWorkingDays,
            minDate: new Date(year, 0, 1),
            maxDate: new Date(year, 11, 31),
            numberOfMonths: [3, 4]
        });

        $this.closest("form").submit(function () {
            var dates = $this.multiDatesPicker("getDates", "object");

            var datesJs = new Array();
            for(var dIndex=0;dIndex<dates.length;dIndex++) {
                var date = dates[dIndex];
                datesJs.push({
                    Year: date.getFullYear(),
                    Month: date.getMonth() + 1,
                    Day: date.getDate()
                });
            }

            var $input = $("<input type='hidden' name='{0}'>".format($this.attr("name")));
            $input.val(JSON.stringify(datesJs));

            $(this).append($input);
        });
    });
});