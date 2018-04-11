"use strict";

let socket: any = null;

function getDevices() {
    const controllerIDs: string[] = [];
    $(".controller-machine-name").each((index, element) => {
        if (element.innerText) {
            controllerIDs.push(`controllers/${element.innerText}/presence`);
        }
    });

    return controllerIDs;
}

function getPresenceData() {
    const devices = getDevices();
    if (devices[0]) {
        const data = {
            apiToken: $("#apiToken").val(),
            action: "subscribe",
            topics: devices
        };

        send(data);
    }
    $(".controller-page").text("No devices added yet!").addClass("no-devices");
}

function updateDOM(data: object) {
    console.log(data);
    if (data && data.controllers) {
        for (const controller in data.controllers) {
            $(`[data-machine-id=${controller.machine_name}]`).find(".status").addClass("connected");
        }
    } else
        console.log("bad response");
}

function send(message: object) {
    console.log("message sent:", message);
    socket.send(JSON.stringify(message));
}

function connect() {
    return new Promise((resolve) => {
        socket = new WebSocket(`ws://${window.location.hostname}:8080`);

        // Connection opened
        socket.addEventListener("open", function (event) {
            getPresenceData();
            console.log(event);
            resolve();
        });

        // Listen for messages
        socket.addEventListener("message", function (event) {
            const data = JSON.parse(event.data);
            updateDOM(data);
        });
    });
}

$(window).on('load', async function () {
    await connect();

    const payload = {
        action: "publish",
        topic: "controllers/aaa/presence",
        payload: "test",
        apiToken: $("#apiToken").val(),
        options: {
            retain: true
        }
    };

    send(payload);
});


