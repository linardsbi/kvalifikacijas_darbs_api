// import * as Highcharts from "highcharts";
// TODO: customisable charts (more db stuff), chart wrapper object, switch to webpack

(function ($) {
    "use strict";
    let chart: any;

    Highcharts.setOptions({
        global: {
            useUTC: false
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
                    ]
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
                    resolve(response);
                },
                error: (response: any) => {
                    const errorMessage = `An error occurred while fetching the devices for the graph. <br />
                    the error: <pre>${response.responseJSON.error}</pre>`;

                    ModalDialog.alert("An error occurred", errorMessage, true);
                }
            });
        });
    }

    async function getLatestData() {
        const response: any = await queryLatestData();
        const deviceIDs: any = {};
        const currentSeries: any = {};
        const noDataOverlay: any = $("div.no-data");

        if (response[0] && response[0].success) {
            response.splice(0, 1);
        }

        if (!response[0]) {
            noDataOverlay.show();
        } else {
            noDataOverlay.hide();
        }

        response.forEach((value: any, index: number) => {
            if (value[index]) {
                value = value[index];

                if (!deviceIDs[`${value.device.name} (${value.device.pin_name})`]) {
                    deviceIDs[`${value.device.name} (${value.device.pin_name})`] = value.device._id;
                }

                if (!currentSeries[`${value.device.name} (${value.device.pin_name})`]) {
                    currentSeries[`${value.device.name} (${value.device.pin_name})`] = [[Date.parse(value.createdAt), parseFloat(value.payload.payload_body)]];
                } else {
                    currentSeries[`${value.device.name} (${value.device.pin_name})`]
                        .push(
                            [Date.parse(value.createdAt), parseFloat(value.payload.payload_body)]);
                }
            }
        });

        Object.keys(currentSeries).forEach((value) => {
            chart.addSeries({
                name: value,
                type: "line",
                yAxis: "1",
                id: deviceIDs[value],
                data: currentSeries[value]
            });
        });

    }

    function initChart() {
        return new Promise(async (resolve) => {
            // const dataSeries = await getLatestData();
            // const firstSeriesName = Object.keys(dataSeries)[0];
            // console.log(firstSeriesName, dataSeries[firstSeriesName]);
            Highcharts.error = function (code) {
                // See https://github.com/highcharts/highcharts/blob/master/errors/errors.xml
                // for error id's
                $("#sensor-graph").text(`An error occurred: ${code}`);
            };

            chart = Highcharts.stockChart("sensor-graph", {
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg,
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
                xAxis: {
                    type: "datetime",
                    tickPixelInterval: 150
                },
                yAxis: {
                    title: {
                        text: 'Value'
                    },
                    id: "1",
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                rangeSelector: {
                    enabled: true
                },
                legend: {
                    enabled: true
                },
                exporting: {
                    enabled: true
                },
                series: [

                ]
            });
        });
    }

    async function graphs() {
        const graph = $("#sensor-graph");

        await initChart();

        graph.removeClass("loading").addClass("opened");
    }

    $(window).on("load", function () {
        graphs();
    });


})(jQuery);