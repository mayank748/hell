
const express = require("express");
const http = require("http");
const app = express();
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
const server = http.createServer(app);
app.listen()
const socket = require("socket.io");
const io = socket(server);

const users = {};

const socketToRoom = {};

io.on('connection', socket => {
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 2) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
    });

    socket.broadcast.emit('userPresent','hello');

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
    });

});

server.listen(3030, () => console.log('server is running on port 3030'));

// server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// const port = process.env.PORT || 3030

// server.listen(port, ()=>{
//     console.log(`Server running on port ${port}`)
// })

// CREATE TABLE accounts (
// 	user_id serial PRIMARY KEY,
// 	storeName VARCHAR ( 50 ) UNIQUE NOT NULL,
// 	password VARCHAR ( 50 ) NOT NULL,
// 	storeManager VARCHAR ( 255 ) UNIQUE NOT NULL,
// 	callEndedAutomatically TIMESTAMP NOT NULL
// );

// select *
// from video_call_table;

// ALTER TABLE accounts RENAME TO video_call_table

// ALTER TABLE video_call_table 
// DROP COLUMN IF EXISTS callEndAutomatically;

// ALTER TABLE video_call_table
//   ADD COLUMN "callEndAutomatically" BOOLEAN NOT NULL DEFAULT FALSE;
  
//   -- Database: demoVideoCall

// -- DROP DATABASE "demoVideoCall";

// CREATE DATABASE "demoVideoCall"
//     WITH 
//     OWNER = postgres
//     ENCODING = 'UTF8'
//     LC_COLLATE = 'English_India.1252'
//     LC_CTYPE = 'English_India.1252'
//     TABLESPACE = pg_default
//     CONNECTION LIMIT = 1;
	
// 	CREATE USER maya WITH PASSWORD 'jw8s0F4';
	
// 	ALTER TABLE video_call_table 
// RENAME COLUMN callEndedAutomatically TO callendedautomatically;

// ALTER TABLE video_call_table ADD COLUMN callendedautomatically BOOLEAN;

// ALTER TABLE video_call_table ALTER COLUMN callendedautomatically SET DEFAULT FALSE;

// ALTER TABLE video_call_table ALTER COLUMN callendedautomatically SET NOT NULL;

// select * from video_call_table;

// SELECT * FROM video_call_table;

// TRUNCATE video_call_table;

// select * from user_present;

// TRUNCATE user_present;

// DELETE FROM user_present WHERE storename = 'pqr';

