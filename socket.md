Frontend socket init
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});


4️⃣ Frontend behavior (important)

Frontend must:

On socket error → show message

On reconnect → re-emit quiz:join

Example:

socket.on("quiz:error", (e) => {
  alert(e.message);
});

socket.on("connect", () => {
  socket.emit("quiz:join", { sessionId });
});