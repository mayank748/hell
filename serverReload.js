
const express = require("express");
const http = require("http");
const { v4: uuid } = require("uuid");
const app = express();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
const server = http.createServer(app);
app.listen()
const socket = require("socket.io");
const { Pool, Client } = require('pg')

const io = socket(server);

let users = {};
var usersInThisRoom ;
const socketToRoom = {};
var socketToRoomError;

const pool = new Pool({
    user: 'maya',
    host: 'localhost',
    database: 'project_details',
    password: 'jw8s0F4',
    port: 5432,
})
// pool.query('SELECT * FROM video_call_table', (err, res) => {
//   console.log(err, res)
//   pool.end()
// })

const client = new Client({
    user: 'maya',
    host: 'localhost',
    database: 'project_details',
    password: 'jw8s0F4',
    port: 5432,
})
client.connect()
// client.query('SELECT * FROM video_call_table', (err, res) => {
//   console.log(err, res)
//   client.end()
// })

io.on('connection', async socket => {
    const pool = new Pool({
        user: 'maya',
        host: 'localhost',
        database: 'project_details',
        password: 'jw8s0F4',
        port: 5432,
    })

    socket.on("userRoomError", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 2) {
                socket.emit("refreseedUser", usersInThisRoom);
                socket.emit("room full");
                return;
            }
                users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        // usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        console.log('usersInThisRoom from userRoomError', usersInThisRoom);
        //socket.emit('yourID', socket.id);
        // socket.emit("refreseedUser", usersInThisRoom);
    });

    socket.on("userlistEmpty", () => {
        users = {};
    })

    socket.on("join room", roomID => {

        const userPresent = getUser(roomID);
        userPresent.then(elementValue => {
            // console.log(elementValue.rows[0].storename);
            if (elementValue.rows[0] && elementValue.rows[0].storename === roomID) {
                //socket.emit('userDisconnectedWithError');
            } else {
                socket.emit('yourID', socket.id);
            }
        })
        console.log('after hitting')
        usersInThisRoom = users[roomID]?users[roomID].filter(id => id !== socket.id):{};

        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 2) {
                socket.emit("refreseedUser", usersInThisRoom);
                socket.emit("all users", users);
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socket.emit('yourID', socket.id);
        // socket.on('userId',(data)=>{
        //     console.log('data',data);
        //     if (users[roomID]) {
        //         const length = users[roomID].length;
        //         if (length === 2) {
        //             socket.emit("refreseedUser", usersInThisRoom);
        //             socket.emit("room full");
        //             //return;
        //         }
        //         users[roomID].push(data);
        //     } else {
        //         users[roomID] = [data];
        //     }
        // })

        // socketToRoom[socket.id] = roomID;
        
        
        console.log('usersInThisRoom', usersInThisRoom);
        socket.emit("refreseedUser", usersInThisRoom);

        // socket.emit("refreseedUser", usersInThisRoom);

        socket.emit("all users", users);
    });

    socket.on('updateUser',payload=>{
        console.log('user beeefore update',users[payload.roomID])
        users[payload.roomID] = [...[users[payload.roomID][0]],...[payload.userId]];
        console.log('user after update',users[payload.roomID])
        usersInThisRoom = users[payload.roomID].filter(id => id !== payload.userId)
        //socket.emit("refreseedUser", usersInThisRoom);
    })

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });


    socket.on('disconnect', () => {
        console.log('disconnect')
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        const userPresent = getUser(roomID);
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        userPresent.then(firstResponse => {
            return firstResponse
        }).then(async secondResoponse => {
            if (!secondResoponse.rows && !secondResoponse.rows.length === 1) {
                console.log('user deleted')
                await removePerson(roomID);
            }
        })
    });

   socket.emit("all users", users);

    socket.on('callUser', (data) => {
        console.log('user to call', data);
        io.to(data.to).emit('hey', data)
    })

    socket.on('acceptCall', (data) => {
        console.log('accept call', data);
        io.to(data.to).emit('callAccepted', data.signal)
    });

    socket.on('rejected', (data) => {
        io.to(data.to).emit('rejected')
    })

    socket.emit('reconnect');

    socket.on("closedDueToError", data => {
        console.log('closedDueToError', data);
        // updatePersonName(data, true);
        registerUser(data);
    })

    socket.on('removeUserCausingError', (data) => {
        console.log('data', data);
        removeStore(data);
    })

    await pool.end();
});

async function registerUser(details) {
    const userPresent = getUser(details);
    userPresent.then(firstResponse => {
        return firstResponse
    }).then(secondResoponse => {
        // console.log('secondResoponse in user present', secondResoponse);
        if (secondResoponse.rows && secondResoponse.rows.length === 1) {
            console.log('user persent')
            return true;
        } else {
            const text = `
            INSERT INTO user_present (storename)
            VALUES ($1)
        `;
            const values = [`${details}`];
            return pool.query(text, values);
        }
    })
}

async function getUser(details) {
    const text = `SELECT * FROM user_present WHERE storename = $1`;
    const values = [details];
    return pool.query(text, values);
}

async function removeStore(personId) {
    const text = `DELETE FROM user_present WHERE storename = $1`;
    const values = [personId];
    return pool.query(text, values);
}

async function registerPerson(person) {
    const perSonValue = getPerson(person)
    perSonValue.then(itemValue => {
        return itemValue;
    }).then(element => {
        console.log('elemnet', (element.rows.length) === 1);
        if (element.rows && element.rows.length === 1) {
            console.log('update person')
            updatePersonName(person, true);
        } else {
            const text = `
                INSERT INTO video_call_table (storename, storemanager, callendedautomatically)
                VALUES ($1, $2, $3)
            `;
            const values = [`${person}`, '2', true];
            return pool.query(text, values);
        }
    })
}

async function getPerson(personId) {
    const text = `SELECT * FROM video_call_table WHERE storename = $1`;
    const values = [personId];
    return pool.query(text, values);
}

async function updatePersonName(personId, fullname) {
    const text = `UPDATE video_call_table SET callendedautomatically = $2 WHERE storename = $1`;
    const values = [personId, fullname];
    return pool.query(text, values);
}

async function removePerson(personId) {
    const text = `DELETE FROM video_call_table WHERE storename = $1`;
    const values = [personId];
    return pool.query(text, values);
}

server.listen(3003, () => console.log('server is running on port 3003'));


