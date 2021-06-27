import { socket, video } from "./main";
import { BackendRequest, RoomInfo } from "../../../interfaces";

let query = new URLSearchParams(window.location.search)

socket.on("connect", () => {
    if (query.has("roomID")) {
        socket.emit("roomAssign", query.get("roomID"), (res: BackendRequest<RoomInfo>) => {
            if (res.isOk) {

                // video.src = res.value;

                /* Subscribe to events */
            } else {
                window.alert(`Unable to connect to room ${query.get("roomID")}. Please try again!`)
            }
        })
    }
})