$(function () {
    $(".yoda-apex-line-chart").each(function () {
        var options = JSON.parse($(this).attr("data-chart-options"));
        var containerId = $(this).attr("id");
        var chart = new ApexCharts(document.querySelector(`#${containerId}`), options);
        chart.render();
    });
});