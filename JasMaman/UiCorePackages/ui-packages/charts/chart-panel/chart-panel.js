$(document).ready(function ($) {
    $(".chart-panel").each(function () {
        var $this = $(this);
        var xAxisLabels = JSON.parse($this.attr("xAxisLables"));
        
        var rows = JSON.parse($this.attr("rows"));
        var chartType = JSON.parse($this.attr("chartType"));
        
        var chartRows = [];
        var dataNames = {};
        
        for(var i=0;i<rows.length;i++) {
            var curRow = rows[i];
            var r = [];
            r.push(curRow.Name);
            dataNames[curRow.Name] = curRow.Text;
            for(var j=0;j<curRow.Values.length;j++) {
                r.push(curRow.Values[j]);
            }
            chartRows.push(r);
        }
        var chartTypes = {
            0: "line",
            1: "bar",
            2: "pie"
        };

        var max = function(x, y) {
            return ((x > y) ? x : y);
        };

        var chart = c3.generate({
            bindto: $this[0],
            data: {
                columns: chartRows,
                type: chartTypes[chartType],
                names: dataNames,
            },
            legend: {
                position: 'right'
            },
            size: {
                height: max(320, rows.length*23 + 23)
            },
            grid: {
                y: {
                    lines: chartTypes[chartType] == "line" 
                        ? [ {value: 0} ]
                        :[]
                }
            },
            axis: {
                x: {
                    type: 'category',
                    categories: xAxisLabels
                }
            }
        });
        $this.data("c3", chart);
    });
});