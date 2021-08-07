const express = require("express");
const http = require("http");
const app = express();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
const server = http.createServer(app);
app.listen()
const socket = require("socket.io");
const io = socket(server);

// var DbOpration = require("./DbCaller.js");
// let config = require("./config.js");

const winston = require("winston");
require("winston-daily-rotate-file");
var path = require("path");
var transports = [];

transports.push(
    new winston.transports.DailyRotateFile({
        name: "file",
        datePattern: "yyyy-MM-DD-HH",
        filename: path.join("LogFiles", "NodeJs.log"),
    })
);
// Logger configuration

const logConfiguration = {
    transports: transports,
};

// Create the logger
const logger = winston.createLogger(logConfiguration);

const users = {}
let userData;
let storeStatus = false;
var onlineManager = [];
var storeOnline = [];
var storeManagerDetails = [];

// storeDetails.storeManagerDetails=storeManagerDetails;
console.log('storeOnline', storeOnline);

function removeItem(arr, item) {
    var itemValue = arr.filter(f => f !== item)
    console.log('item', itemValue);
    return arr.filter(f => f !== item)
}

isEmpty = obj => !Object.values(obj).filter(e => typeof e !== 'undefined').length;

var myMap = new Map();
var userEngaged = new Map();
let userid;
io.on('connection', socket => {
    socket.on('storeOnline', store => {
        if (!users[store]) {
            users[store] = socket.id
        }

        io.sockets.emit('allUsers', users)

        socket.on('disconnect', () => {
            console.log('user disconnected', store);
            delete users[store]
        })
    })

    socket.on('mobileNumber', mobileNo => {
        userid = mobileNo;
        socket.on('storeMangerDetail', managerDetails => {
            console.log('managerDetails', managerDetails);
            const found = storeOnline.find(element => element == mobileNo);
            console.log('found', found);
            // console.log('isEmpty',isEmpty(storeDetails));
            var storeManger = {
                managerCode: managerDetails.managerCode,
                storeCode: managerDetails.storeCode,
                isOnline: managerDetails.isOnline,
                isBusy: managerDetails.isBusy,
                isCalling: managerDetails.isCalling
            }

            console.log('storeOnline', storeOnline);
            if (!found) {
                storeOnline.push(mobileNo);
                myMap.set(mobileNo, [])
                myMap.get(mobileNo).push(storeManger);
            }
            // if (!found) {
            //     myMap.set(mobileNo, [])
            //     myMap.get(mobileNo).push(storeManger);
            // }
            const foundManageCode = myMap.get(mobileNo).find(element => element.managerCode === managerDetails.managerCode);
            console.log('foundManageCode', foundManageCode)
            if (!foundManageCode || (managerDetails.managerCode !== foundManageCode.managerCode)) {
                myMap.get(mobileNo).push(storeManger);
            } else {
                console.log('myMap.get(mobileNo).indexOf(foundManageCode)', myMap.get(mobileNo).indexOf(foundManageCode))
                myMap.get(mobileNo)[myMap.get(mobileNo).indexOf(foundManageCode)] = storeManger;
            }
            console.log('myMap', myMap);
        })
        socket.on('storeManagerStatus', data => {
            console.log('GetManagerStatus', data.storeCode)
            if (data.storeCode === mobileNo && data.isOnline && !data.isBusy) {
                console.log('data', data)
                onlineManager.push(data);
                console.log('log on 57 onlineManager', onlineManager);
            } else {
                removeItem(onlineManager, data.mangerCode);
            }
            console.log('log on 61 onlineManager', onlineManager);
        })
        console.log('log on 63 onlineManager', onlineManager);
        console.log('user connected ', mobileNo);
        if (!users[userid]) {
            users[userid] = socket.id
        }
        socket.emit('yourID', userid)
        io.sockets.emit('allUsers', users)

        socket.on('userDetails', data => {
            console.log('userDetails 29', data);
            // handleGetFBID(data);
            // console.log('userData',userData);
            io.to(users[userData.userToCall]).emit('callerDetails', data);
            // handelSendFirebaseMessageById(data.mobile, 'mayank', data)
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
            userData = data;
            console.log('data', data.userToCall);
            console.log('myMap.get(mobileNo)', myMap.get(data.userToCall));
            myMap.get(data.userToCall).forEach(element => {
                console.log('element', element);
                io.to(users[element.storeCode + element.managerCode]).emit('callerDetails', data.userDetails);
                //io.to(users[data.from]).emit('updatedReciverID', element.storeCode + element.managerCode);
                if (element.isOnline && !element.isBusy && !element.isCalling) {
                    data.userToCall = element.storeCode + element.managerCode;
                    io.to(users[data.userToCall]).emit('hey', { signal: data.signalData, from: data.from })
                    console.log('element and data', element, 'data', data);
                    io.to(users[data.from]).emit('updatedReciverID', element.storeCode + element.managerCode);
                }
                else {
                    io.to(users[data.from]).emit('mangerStatus', true)
                    io.to(users[data.userToCall]).emit('mangerStatus', true)
                }
            });
        })

        socket.on('acceptCall', (data) => {
            console.log('accept call', data);
            io.to(users[data.to]).emit('callAccepted', data.signal)
            console.log('data.storeCode', myMap.get(data.storeCode))

            //To update the not accepted manager isBusy variable.
            myMap.get(data.storeCode).find(element => {
                // if (element.managerCode !== data.managerCode) {
                element.isBusy = false
                //}
            });

            data.managerDetails.isCalling = true;
            const foundManageCode = myMap.get(data.storeCode).find(element => element.managerCode === data.managerCode);
            console.log('foundManageCode', foundManageCode)
            var callingManageCodeIndex = myMap.get(data.storeCode).indexOf(foundManageCode);
            console.log('callingManageCodeIndex', callingManageCodeIndex);
            myMap.get(data.storeCode)[callingManageCodeIndex] = data.managerDetails;
            console.log('data.storeCode', myMap.get(data.storeCode))

            //console.log('userEngaged.get(data.storeCode)', userEngaged.get(data.storeCode))

            var userConnected = {
                userDetaisl: data.userDetaisl,
                engaedManagerDetaisl: data.managerDetails,
                userCode: data.to
            }

            // if (userEngaged.get(data.storeCode) === undefined) {
            //     userEngaged.set(data.storeCode, []);
            //     userEngaged.get(data.storeCode).push(userConnected);
            // }

            // console.log('userConnected', userConnected);
            // const foundEngaedManageCode = userEngaged.get(data.storeCode).find(element => element.engaedManagerDetaisl.managerCode === data.managerCode);
            // console.log('foundEngaedManageCode', foundEngaedManageCode)
            // if (foundEngaedManageCode===undefined) {
            //     console.log('inside the if case')
            //     userEngaged.get(data.storeCode).push(userConnected);
            // } else {
            //     console.log('inside the else')
            //     userEngaged.get(data.storeCode)[userEngaged.get(data.storeCode).indexOf(foundEngaedManageCode)] = userConnected;
            // }

            // // userEngaged.get(data.storeCode).push(userConnected);
            // console.log('userEngaged.get(data.storeCode)', userEngaged.get(data.storeCode));

            myMap.get(data.storeCode).forEach(element => {
                var notBusyManager = element.storeCode + element.managerCode;
                //io.to(users[notBusyManager]).emit('userEngaged', userEngaged.get(data.storeCode));
                io.to(users[notBusyManager]).emit('userEngaged', userConnected);
                if (element.isOnline && !element.isBusy && !element.isCalling) {
                    io.to(users[notBusyManager]).emit('notBusyManager', true);
                } else {
                    io.to(users[data.to]).emit('updatedReciverID', notBusyManager);
                }
            });
        });

        socket.on('callingManagerDetails', data => {
            // if (userEngaged.get(data.storeCode)!==undefined) {
            //     console.log('userEngaged.get(data.storeCode)',userEngaged.get(data.storeCode));
            //     const deleteManageCode = userEngaged.get(data.storeCode).find(element => element.engaedManagerDetaisl.managerCode === data.managerCode);
            //     console.log('deleteManageCode',deleteManageCode);
            //     var deleteManageCodeIndex=userEngaged.get(data.storeCode).indexOf(deleteManageCode);
            //     console.log('deletdeleteManageCodeIndexeManageCode',deleteManageCodeIndex);
            //     if(deleteManageCodeIndex>=0){
            //         userEngaged.get(data.storeCode).splice(deleteManageCodeIndex, 1)
            //     }
            // }
            const foundManageCode = myMap.get(data.storeCode).find(element => element.managerCode === data.managerCode);
            console.log('foundManageCode', foundManageCode);
            console.log('callingManagerDetails myMap.get(data.storeCode)', myMap.get(data.storeCode));
            myMap.get(data.storeCode)[myMap.get(data.storeCode).indexOf(foundManageCode)] = data;
            console.log('callingManagerDetails myMap.get(data.storeCode)', myMap.get(data.storeCode));
        })

        socket.on('close', (data) => {
            console.log('data on close', data);
            io.to(users[data.to]).emit('close',data);
        })

        // socket.on('callStoped', (data) => {
        //     myMap.get(data.to).forEach(element => {
        //         if (element.isBusy) {
        //             data.to = element.storeCode + element.managerCode
        //             element.isBusy=false;
        //             io.to(users[data.to]).emit('close')
        //         }
        //     })
        //     console.log('on call stop', myMap.get(data.to));
        // })

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

        console.log('log on 128 onlineManager', onlineManager);
        console.log('storeManagerDetails', storeManagerDetails);

        socket.on('storeManagerRefreshed', (data)=>{
            console.log(data);
        });
    })
})


function handleGetFullDateTimes() {
    var today = new Date();

    var date =
        today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

    var time =
        today.getHours() +
        ":" +
        today.getMinutes() +
        ":" +
        today.getSeconds() +
        ":" +
        today.getMilliseconds();

    var dateTime = date + " " + time;
    return dateTime;
}


function handleGetFBID(params) {
    var dataParam = {};
    dataParam.ProgramCode = params.programCode;
    dataParam.MobileNo = params.mobile;
    dataParam.StoreCode = params.storeCode;
    if (config.ErrorLog) {
        logger.log({
            message:
                "Time: " +
                handleGetFullDateTimes() +
                ": Request| CallGetCustomerFBIDSP : " +
                JSON.stringify(dataParam),
            level: "info",
        });
    }

    // console.log('dataParam', dataParam);

    try {
        DbOpration.handleDbGetCustomerFBIDSPCalling(
            dataParam,
            function (responseData) {
                if (config.ErrorLog) {
                    logger.log({
                        message:
                            "Time: " +
                            handleGetFullDateTimes() +
                            ": Response| CallGetCustomerFBIDSP : " +
                            JSON.stringify(responseData),
                        level: "info",
                    });

                    if (responseData[0]) {
                        handelSendFirebaseMessageById(
                            params.mobile,
                            params.customerName + ' is calling in shopster',
                            responseData[0]
                        );
                    }
                }
            }
        );
    } catch (error) {
        if (config.ErrorLog) {
            logger.log({
                message:
                    "Time: " +
                    handleGetFullDateTimes() +
                    ": Request| CallUpdateChatNotificationSP : " +
                    error,
                level: "error",
            });
        }
        console.log(error, "---CallUpdateChatNotificationSP");
    }
}

function handelSendFirebaseMessageById(mobileNo, Message, token) {
    // console.log('log at line 188', mobileNo, Message, token)
    for (let i = 0; i < token.length; i++) {
        var custName = "";
        if (token[i].CustomerName) {
            custName = token[i].CustomerName;
        } else {
            custName = "DirectMember";
        }
        if (token[i].FBNID) {
            const data = {
                to: token[i].FBNID,
                collapse_key: "type_a",
                notification: {
                    title: custName + ": " + mobileNo,
                    body: Message || "",
                },
                data: {
                    title: custName + ": " + mobileNo,
                    body: Message || "",
                },
            };
            const dataString = JSON.stringify(data);
            var headerKey = "";
            if (token[i].DeviceSource) {
                if (token[i].DeviceSource.toLowerCase() == "android".toLowerCase()) {
                    headerKey = "key=" + config.fireBaseServerkey_Android;
                } else {
                    headerKey = "key=" + config.fireBaseServerkey_IOS;
                }
            } else {
                return false;
            }

            const headers = {
                Authorization: headerKey,
                "Content-Type": "application/json",
                "Content-Length": dataString.length,
            };

            const options = {
                uri: "https://fcm.googleapis.com/fcm/send",
                method: "POST",
                headers: headers,
                json: data,
            };

            const request = require("request");

            request(options, function (err, res, body) {
                console.log('err 235', err)
                if (err) throw err;
                else console.log(body);
            });
        }
    }
}

const port = process.env.PORT || 3003

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})