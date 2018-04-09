"use strict";

let connection: any = null;

function connect() {
  const socket = new WebSocket(`ws://${window.location.hostname}:8080/${$("#clientID").val()}/presence`);

  // Connection opened
  socket.addEventListener("open", function (event) {
      socket.send("Hello Server!");
  });

  // Listen for messages
  socket.addEventListener("message", function (event) {
      console.log("Message from server ", event.data);
  });
}


$(document).ready(function () {
  connect();
});


