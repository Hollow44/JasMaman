$(document).ready(
    function ($) {
        $("[date-box]").each(
            function () {
                $(this).datepicker({ dateFormat: 'dd.mm.yy', changeYear: true, changeMonth: true, yearRange: '1991:2030' });
            }
        );
    });