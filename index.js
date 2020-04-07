const Discord = require('discord.js');
const clientSettings = require("./botsettings.json");
const client = new Discord.Client();
const prefix = clientSettings.prefix;
const mysql = require('mysql');
const ECONOMYx = 10;
const RANKS = ["Newbie", "Member", "Advanced Member", "Premium", "VIP", "Legend"];
const COLORS = ["DARK_GREY", "WHITE", "ORANGE", "LUMINOUS_VIVID_PINK", "YELLOW", "DARK_AQUA"];
//MYSQL CONNECTION AND FUNCTIONS
var connection = {
    handle: null,
    connect: function(call) {
        //ADD YOUR DATABASE INFORMATION HERE
        this.handle = mysql.createConnection({
            host: "",
            user: "",
            password: "",
            database: ""
        });
        this.handle.connect(function(err) {
            if (err) {
                switch (err.code) {
                    case "ECONNREFUSED":
                        console.log("\x1b[93m[MySQL] \x1b[97mError: Check your connection details (packages/mysql/mysql.js) or make sure your MySQL server is running. \x1b[39m");
                        break;
                    case "ER_BAD_DB_ERROR":
                        console.log("\x1b[91m[MySQL] \x1b[97mError: The database name you've entered does not exist. \x1b[39m");
                        break;
                    case "ER_ACCESS_DENIED_ERROR":
                        console.log("\x1b[91m[MySQL] \x1b[97mError: Check your MySQL username and password and make sure they're correct. \x1b[39m");
                        break;
                    case "ENOENT":
                        console.log("\x1b[91m[MySQL] \x1b[97mError: There is no internet connection. Check your connection and try again. \x1b[39m");
                        break;
                    default:
                        console.log("\x1b[91m[MySQL] \x1b[97mError: " + err.code + " \x1b[39m");
                        break;
                }
            } else {
                console.log("\x1b[92m[MySQL] \x1b[97mConnected Successfully \x1b[39m");
            }
        });
    }
};
connection.connect(function() {});

async function databaseInsert(userId, serverId, startingPoints) {
    connection.handle.query("INSERT INTO `points`(`id`, `userId`, `serverId`, `userPoints`) VALUES (NULL, '" + userId + "','" + serverId + "','" + startingPoints + "')", function(err, res) {
        if (err) console.log(err);
    });
    return 1;
}

async function databaseUpdate(userId, serverId, points) {
    connection.handle.query("UPDATE `points` SET `userPoints` = (`userPoints` + ?) WHERE userid = ? AND serverId = ?", [points, userId, serverId], function(err, res) {
        if (err) console.log(err);
    });
    return 1;
}

function getPoints(userid, serverId) {
    connection.handle.query('SELECT `userPoints` FROM `points` WHERE `userId` = ' + userId + ' AND `serverId` = ' + serverId, function(err, res, row) {
        if (err) console.log(err);
        if (res.length != 0) {
            return res[0].userPoints;
        } else return -1;
    });
}

function databaseDelete(serverId) {
    connection.handle.query("DELETE FROM points WHERE serverId='" + server + "'", function(err, res) {
        if (err) console.log(err);
    });
    return 1;
}
//
//CLIENT(BOT) FUNCTIONS
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('YOUR POINTS', { type: 'WATCHING' });
});
client.on("guildCreate", guild => {
    console.log(`Joined ${guild.name}`);
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (!guild.roles.cache.has(`${RANKS[i]}`)) {
            guild.roles.create({
                    data: {
                        name: `${RANKS[i]}`,
                        color: `${COLORS[i]}`,
                        hoist: true,
                        position: 0,
                    }
                })
                .then(console.log)
                .catch(console.error);

        }

    }

})
client.on("guildDelete", guild => {
    let server = guild.id;
    databaseDelete(server);

});
//BOT COMMANDS w/o COMMANDO
client.on('message', msg => {
    //MSG CHECKS
    if (!msg.content.startsWith(prefix) || msg.author.bot) return;
    const args = msg.content.slice(prefix.length).split(' ');
    const commandNoPrefix = msg.content.replace(prefix, '');
    const command = args.shift().toLowerCase();
    /*

        //ping command


    */

    if (commandNoPrefix.search("ping") != -1) {
        msg.reply("pong");
    }

    if (commandNoPrefix.search("pong") != -1) {
        msg.reply("ping");
    }

    /*

        //GIVE POINTS COMMAND


    */

    if (commandNoPrefix.search("givep") != -1) {
        if (args[0] === undefined || args[1] === undefined) {
            msg.channel.send("Syntax: " + prefix + "givep {number of credits} {username/mention of the user}");
            return 1;
        }
        let points = parseInt(args[0]);
        let server = msg.guild.id;
        let userNameArgs = args[1];
        let user = args[1];
        let userName = "";
        if (args.length > 2) {
            for (let i = 2; i < args.length; i++) {
                userName = args[1].concat(" ");
                userName = userName.concat(args[i]);
            }
            user = userName;
        }

        if (userNameArgs.search('@') != -1) {
            if (userNameArgs.indexOf("everyone") !== -1) {
                let userL = msg.guild.members.cache.keyArray();
                console.log(userL);
                for (let i = 0; i < userL.length; i++) {
                    connection.handle.query('SELECT `id` FROM `points` WHERE `userId` = ?',[userL[i]], ' AND `serverId` = ?',[server], function(err, res, row) {
                        if (!err) {
                            console.log(res.length);
                            if (res.length != 0) databaseUpdate(userL[i], server, points);
                            else databaseInsert(userL[i], server, points);
                        } else console.log(err);
                    });
                }
                return 1;
            } else {
                user = msg.mentions.users.first().id;
                //users = msg.mentions.users.map();
                //console.log(users);
            }
        } else {
            user = client.users.cache.findKey(user => user.username === userName);
        }
        connection.handle.query('SELECT `id` FROM `points` WHERE `userId` = ' + user + ' AND `serverId` = ' + server, function(err, res, row) {
            if (!err) {
                console.log(res.length);
                if (res.length != 0) databaseUpdate(user, server, points);
                else databaseInsert(user, server, points);
            } else console.log(err);
        });

    }
    /*

        //CHECK POINTS COMAND


    */
    if (commandNoPrefix.search("checkp") != -1) {
        if (args[0] === undefined) {
            msg.channel.send("Syntax: " + prefix + "checkp {username}");
            return 1;
        }
        let userNameArgs = args[0];

        let user = args[0];
        let userName = "";
        if (args.length > 1) {
            for (let i = 1; i < args.length; i++) {
                userName = args[0].concat(" ");
                userName = userName.concat(args[i]);
            }
            user = userName;
            console.log(user);
        }

        if (userNameArgs.search('@') != -1) {
            user = msg.mentions.users.first().id;
        } else {
            user = client.users.cache.findKey(user => user.username === userName);
            console.log(user);
        }


        let server = msg.guild.id;
        let pointsCheck = 0;
        connection.handle.query('SELECT `userPoints` FROM `points` WHERE `userId` = ' + user + ' AND `serverId` = ' + server, function(err, res, row) {
            if (err) console.log(err);
            if (res.length != 0) {
                pointsCheck = res[0].userPoints;
                msg.author.send(`<@!${user}> has ${pointsCheck} points.`);
            } else {
                msg.author.send(`<@!${user}> has ${pointsCheck} points.`);
            }
        });
    }
    /*

        //CHECK OWN POINTS(doesn't require special permissions)/

        
    */
    if (commandNoPrefix.search("checkmy") != -1) {
        let user = msg.author.id;
        //console.log(userName);
        let server = msg.guild.id;
        let pointsCheck = 0;
        connection.handle.query('SELECT `userPoints` FROM `points` WHERE `userId` = ' + user + ' AND `serverId` = ' + server, function(err, res, row) {
            if (err) console.log(err);
            if (res.length != 0) {
                pointsCheck = res[0].userPoints;
                msg.author.send(`<@!${user}> has ${pointsCheck} points.`);
            } else {
                msg.author.send(`<@!${user}> has ${pointsCheck} points.`);
            }
        });

    }
    /*

    //REDEEMS REWARDS(based on points ) COMMAND
    
    */






    if (commandNoPrefix.search("redeem") != -1) {
        let user = msg.author.id;
        let server = msg.guild.id;
        let pointsCheck = 0;
        let guildName = client.guilds.cache.get(server);
        let roleName = 0;
        let embed = new Discord.MessageEmbed()
            .setAuthor(`${guildName}`)
            .setColor('GOLD')
            .addFields({ name: 'Multiplier', value: '10x' })
            .setDescription('The multiplier multiplies the points needed for redeeming a role.')
            .setImage('https://i.imgur.com/2lOcQsQ.png')
        connection.handle.query('SELECT `userPoints` FROM `points` WHERE `userId` = ' + user + ' AND `serverId` = ' + server, function(err, res, row) {
            if (err) console.log(err);
            if (res.length != 0) {
                pointsCheck = res[0].userPoints;
                let rank = returnRankId(pointsCheck);
                role = msg.guild.roles.cache.find(role => role.name === RANKS[rank]);
                roleName = role.name;
                msg.member.roles.add(role.id);
                msg.author.send(`You have redeemed your ${roleName} role on the ${guildName} server.`);
            } else {
                msg.author.send(embed);
                msg.author.send(`There has been an error redeeming your role. Please check your points and try again later.`);
            }
        });

    }
});


//FUNCTION THAT RETURNS THE RANK ID (RANKS array index) OF A RANK BASED ON THE POINTS.

function returnRankId(points) {
    if (points < 1 * ECONOMYx) return 0;
    else if (points >= 1 * ECONOMYx && points < 5 * ECONOMYx) return 1;
    else if (points >= 5 * ECONOMYx && points < 20 * ECONOMYx) return 2;
    else if (points >= 20 * ECONOMYx && points < 40 * ECONOMYx) return 3;
    else if (points >= 40 * ECONOMYx && points < 80 * ECONOMYx) return 4;
    else if (points >= 80 * ECONOMYx) return 5;
}


client.login(clientSettings.token);
