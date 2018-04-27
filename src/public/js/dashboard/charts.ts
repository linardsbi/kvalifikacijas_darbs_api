import * as Highcharts from "highcharts";
// TODO: customisable charts (more db stuff), chart wrapper object

"use strict";

function getSeries() {
    // TODO: auto series detection, data plotting
    return [
        {
            name: 'VOLTAGE',
            yAxis: 0,
            style: {
                color: '#2b908f'
            },
            data: (function () {
                // generate an array of random data
                const data = [];
                return data;
            }())
        }, {
            name: 'CURRENT',
            yAxis: 1,
            data: (function () {
                const data = [];
                return data;
            }())
        }, {
            name: 'Moisture',
            yAxis: 2,
            data: (function () {
                const data = [];
                return data;
            }())
        }
    ];
}

Highcharts.setOptions({
    global: {
        useUTC: false
    },
    plotOptions: {
        series: {
            marker: {
                enabled: false
            }
        }
    },
    tooltip: {
        enabled: false
    }
});

export function initChart(chartObject: any) {
    return new Promise((resolve) => {
        chartObject.highcharts({
            chart: {
                type: 'spline',
                events: {
                    load: function () {
                        resolve();
                    }
                }
            },
            title: {
                text: 'Sensor Data'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 500
            },
            yAxis: [{
                title: {
                    text: 'VOLTAGE',
                    style: {
                        color: '#2b908f',
                        font: '13px sans-serif'
                    }
                },
                min: 0,
                max: 15,
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            }, {
                title: {
                    text: 'CURRENT',
                    style: {
                        color: '#90ee7e',
                        font: '13px sans-serif'
                    }
                },
                min: 0,
                max: 4,
                opposite: true,
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            }, {
                title: {
                    text: 'MOISTURE',
                    style: {
                        color: '#f45b5b',
                        font: '13px sans-serif'
                    }
                },
                min: 0,
                max: 100,
                opposite: true,
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            }],
            tooltip: {
                formatter: function () {
                    const unitOfMeasurement = this.series.name === 'VOLTAGE' ? ' V' : ' A';
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.numberFormat(this.y, 1) + unitOfMeasurement;
                }
            },
            legend: {
                enabled: true
            },
            exporting: {
                enabled: false
            },
            series: getSeries()
        });
    });
}

(function ($) {
    $(window).on("load", function () {

    });
})(jQuery);