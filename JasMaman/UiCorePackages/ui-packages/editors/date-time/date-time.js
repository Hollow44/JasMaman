$(document).ready(
    function ($) {
        $("[date-time-box]").each(
            function () {
                /*$(this).datetime({ format: 'dd.mm.yyyy hh:ii', stepMins: 1 });*/
                $(this).datetimepicker({ controlType: 'select', dateFormat: 'dd.mm.yy' });
            }
        );
});