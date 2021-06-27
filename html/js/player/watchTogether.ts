import { socket, video, stateHandler, urlParams as query, urlParams } from "./main";
import { BackendRequest, RoomInfo } from "../../../interfaces";
/*
stateHandler.on("SocketIOConnection", () => {
    console.log("conn", query.has("roomID"))
    if (query.has("roomID")) {
        socket.emit("roomAssign", query.get("roomID"), (res: BackendRequest<RoomInfo>) => {
            console.log(res)
            if (res.isOk) {
                stateHandler.setValue('roomData', res.value)
                socket.emit("roomData", res.value.id, "videoPos", (videoPos: number) => stateHandler.setValue('videoPos', videoPos))
            } else {
                window.alert(`Unable to connect to room ${query.get("roomID")}. Please try again!`)
            }
        })
    }
})
*/



/**
 * @param path The path for the video to create a room 
 */
const createRoom = (path: string) => {
    if (query.has("roomID") || stateHandler.hasValue('roomData') || !path) 
        return;
    socket.emit("createRoom", path, (res: BackendRequest<RoomInfo>) => {
        console.log(res)
        if (res.isOk) {
            stateHandler.setValue('roomData', res.value)
            socket.emit("roomData", res.value.id, "videoPos", (videoPos: number) => stateHandler.setValue('videoPos', videoPos))
            /* Subscribe to events */
        } else {
            window.alert(`Unable to create room. Please try again!`)
        }
    })
}
createRoom(urlParams.get('path'))
stateHandler.subscribe('roomData', (room) => {
    if (room) {
        let roomInfo = room as RoomInfo;
        if (video.src !== roomInfo.videoFile)
            video.src = roomInfo.videoFile
    }
})

stateHandler.subscribe('videoPos', (videoPos) => {
    if (videoPos) {
        video.currentTime = videoPos as number;
    }
})

export { createRoom }