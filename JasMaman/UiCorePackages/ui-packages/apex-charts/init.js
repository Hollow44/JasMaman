$(document).ready(function () {
    $(".chart").each(
        function () {
            //var $this = $(this);
            var colors = ["#0acf97", "#6c757d"];
            var dataColors = $("#simple-pie").data('colors');
            if (dataColors) {
                colors = dataColors.split(",");
            }
            var options = {
                chart: {
                    height: 320,
                    type: 'pie',
                },
                series: [44, 55],
                labels: ["Загружено", "Свободно"],
                colors: colors,
                legend: {
                    show: true,
                    position: 'bottom',
                    horizontalAlign: 'center',
                    verticalAlign: 'middle',
                    floating: false,
                    fontSize: '14px',
                    offsetX: 0,
                    offsetY: 7
                },
                responsive: [{
                    breakpoint: 600,
                    options: {
                        chart: {
                            height: 240
                        },
                        legend: {
                            show: false
                        },
                    }
                }]

            }

            var chart = new ApexCharts(
                this,
                options
            );

            chart.render();

        }
    );
});