"use strict";

let socket: any = null;

function getDevices() {
    const controllerIDs: object = [];
    $(".controller-machine-name").each(() => {
        if ($(this).text()) {
            controllerIDs.push(`controllers/${$(this).text()}/presence`);
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
    } else
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
    console.log("message sent:",message);
    socket.sendMessage(message);
}

function connect() {
  socket = new WebSocket(`ws://${window.location.hostname}:8080`);

  // Connection opened
  socket.addEventListener("open", function (event) {
      getPresenceData();
      console.log(event);
  });

  // Listen for messages
  socket.addEventListener("message", function (event) {
      updateDOM(event.data);
  });
}


$(window).on('load',function () {
  connect();
});


