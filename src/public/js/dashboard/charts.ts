// import * as Highcharts from "highcharts";
// TODO: customisable charts (more db stuff), chart wrapper object, switch to webpack

(function ($) {
    "use strict";

    function getSeries() {
        // TODO: auto series detection, data plotting
        return [
            {
                name: 'Temperature',
                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6],
                color: '#F33'
                //     name: 'VOLTAGE',
                //     yAxis: 0,
                //     style: {
                //         color: '#2b908f'
                //     },
                //     data: (function () {
                //         // generate an array of random data
                //         const data = [];
                //         return data;
                //     }())
                // }, {
                //     name: 'CURRENT',
                //     yAxis: 1,
                //     data: (function () {
                //         const data = [];
                //         return data;
                //     }())
                // }, {
                //     name: 'Moisture',
                //     yAxis: 2,
                //     data: (function () {
                //         const data = [];
                //         return data;
                //     }())
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

    function queryLatestData() {
        return new Promise((resolve, reject) => {
            const query = {
                query: {
                    select: [
                        {
                            createdAt$between: ["NOW", "5d ago"]
                        }
                    ],
                    fields: "_id",
                    limit: "999"
                }
            };
            const url = `data/get?query=${JSON.stringify(query)}`;

            $.ajax({
                headers: {
                    authtoken: $("#apiToken").val().toString()
                },
                method: "get",
                url: url,
                success: (response) => {
                    resolve(response[0]);
                },
                error: (response: any) => {
                    throw new Error(response);
                }
            });
        });
    }

    async function getLatestData() {
        const response = await queryLatestData();
        console.log(response);
    }

    function initChart(chartObject: any) {
        return new Promise((resolve) => {
            chartObject.highcharts({
                chart: {
                    type: 'spline',
                    events: {
                        load: async function () {
                            await getLatestData();
                            resolve();
                        }
                    }
                },
                title: {
                    text: 'Sensor Data'
                },
                xAxis: {},
                yAxis: {},
                tooltip: {
                    formatter: function () {

                    }
                },
                legend: {
                    enabled: true
                },
                exporting: {
                    enabled: true
                },
                series: [{
                    name: 'Data',
                    data: []
                }]
            });
        });
    }

    function graphs() {
        $(".graph-button").on("click", async function () {
            const graph = $(this).parent().siblings(".graph");
            if (!graph.hasClass("loading") && !graph.hasClass("opened")) {
                graph.addClass("loading");
                $(this).attr("disabled", "");

                await initChart(graph);

                $(this).removeAttr("disabled");
                graph.removeClass("loading").addClass("opened");
            } else if (graph.hasClass("opened")) {
                graph.removeClass("opened");
            }
        });
    }

    $(window).on("load", function () {
        graphs();
    });
})(jQuery);