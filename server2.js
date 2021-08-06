
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
    // socket.on("join room", roomID => {
    //     if (users[roomID]) {
    //         const length = users[roomID].length;
    //         if (length === 2) {
    //             socket.emit("room full");
    //             return;
    //         }
    //         users[roomID].push(socket.id);
    //     } else {
    //         users[roomID] = [socket.id];
    //     }
    //     socketToRoom[socket.id] = roomID;
    //     const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

    //     socket.emit("all users", usersInThisRoom);
    // });

    // socket.on("sending signal", payload => {
    //     io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    // });

    // socket.on("returning signal", payload => {
    //     io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    // });

    // socket.on('disconnect', () => {
    //     const roomID = socketToRoom[socket.id];
    //     let room = users[roomID];
    //     if (room) {
    //         room = room.filter(id => id !== socket.id);
    //         users[roomID] = room;
    //     }
    // });

    socket.on('mobileNumber', mobileNo => {
        const userid = mobileNo;
        console.log('user connected ', mobileNo);
        if (!users[userid]) {
            users[userid] = socket.id
        }
        socket.emit('yourID', userid)
        io.sockets.emit('allUsers', users)

        socket.on('userDetails', data => {
            console.log('userDetails 29', data);
            // console.log('userData',userData);
            io.to(users[userData.userToCall]).emit('callerDetails', data);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected', userid);
            delete users[userid]
        })

        socket.on('storemanagerStatus', data => {
            console.log('storeStatus 40', storeStatus)
            console.log('storeStatusdata 41', data)
            storeStatus = data;
        });

        socket.on('callUser', (data) => {
            console.log('calling user ', data);
            userData = data;
            console.log('storeStatus 48', storeStatus)
            if (!storeStatus) {
                io.to(users[data.userToCall]).emit('hey', { signal: data.signalData, from: data.from })
            }
            else {
                io.to(users[data.from]).emit('mangerStatus', storeStatus)
                io.to(users[data.userToCall]).emit('mangerStatus', storeStatus)
            }
            // io.to(users[data.from]).emit('mangerStatus', storeStatus)
            // io.to(users[data.userToCall]).emit('mangerStatus', storeStatus)
        })

        socket.on('acceptCall', (data) => {
            console.log('accept call', data);
            io.to(users[data.to]).emit('callAccepted', data.signal)
        })

        socket.on('close', (data) => {
            io.to(users[data.to]).emit('close')
        })

        socket.on('rejected', (data) => {
            io.to(users[data.to]).emit('rejected')
        })

        socket.on('partnerOnline', (data1, data2) => {
            io.to(users[userData.from]).emit('callerStatus');
        })

        socket.on('updatedVideo', (data) => {
            console.log('inside updatedVideo')
            io.to(users[data.userToCall]).emit('updatedReciverEnd', data)
        })
    })

});

server.listen(4442, () => console.log('server is running on port 3003'));


