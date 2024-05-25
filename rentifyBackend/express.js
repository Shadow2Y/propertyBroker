const express = require('express');
const randomstring = require('randomstring');
const NodeCache = require( "node-cache" );
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
var MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
const svgCaptcha = require('svg-captcha');
const cors = require('cors');
const captchaData = new NodeCache( { stdTTL: 60, checkperiod: 60 } );
const userData = new NodeCache();
const propertyData = new NodeCache();
const nodemailer = require('nodemailer');

const initDataP = require('./propertyData.json')
const initDataU = require('./userData.json')
propertyData.set('propertyList',initDataP.propertyList)
for(var i in initDataU.userData) {
    userData.set(i,initDataU.userData[i])
}

const app = express();
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
  }));

app.use(express.json());
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/myapp',
    collection: 'sessions'
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
    store: store
  }));
const port = 3001;
function sendMail (buyer,owner,name) {
    var transporter = nodemailer.createTransport({
        "host": "127.0.0.1",
        "port":1025,
        "secure": false,
        "auth": {
            "user": userData.get(buyer)["email"],
            "pass": "password"
        },
        "tls": {
            "rejectUnauthorized": false
        }
});

    var mailOptions = {
        from: userData.get(buyer)["email"],
        to: userData.get(owner)["email"],
        subject: 'Interest in your property',
        text: `${userData.get(buyer)["firstName"]} SHOWED INTEREST IN ${name}`
    };
    transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(63,userData.get(buyer)["email"],transporter.options.host)
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  }); 
}

function createUser (data) {
    userName = data.userName
    userData.set(userName,{password:bcrypt.hashSync(data.password,5),firstName:data.firstName,lastName:data.lastName,phNumber:data.phNumber})
}
function populateProperties () {
}
app.get('/captchaid',(req,res) => {
    const captcha = svgCaptcha.create();
    const captchaId = randomstring.generate(6);
    const captchaImg = captcha.data;
    captchaData.set(captchaId,captcha.text);
    console.log("/captchaid")
    res.send({captchaId,captchaImg});
})

app.post('/login',(req,res) => {
    const body = req.body;
    const captchaId = body.captchaId;
    const captchaText = body.captchaText;
    let password = body.password;
    if(captchaData.get(captchaId)!=captchaText || body.userName=='') {
        console.log(44)
        res.send("ERROR");
        return;
    }
    else{
        console.log(48)
    if(body.isRegister)
        createUser(body)
    console.log(body)
    if(!bcrypt.compareSync(req.body.password,userData.get(body.userName).password)) {
        res.send("INVALID")
        return
    }
    req.session.userName = body.userName;
    req.session.firstName = body.firstName;
    req.session.lastName = body.lastName;
    req.session.phNumber = body.phNumber;
    req.session.flow = req.body.flowChoice ? 'BUYER' : 'SELLER';
    res.send({status:"LOGGED IN"})
}})

app.post('/register',(req,res) => {
    const body = req.body;
    const captchaId = body.captchaId;
    const captchaText = body.captchaText;
    let password = body.password;
    if(captchaData.get(captchaId)!=captchaText || body.userName=='') {
        console.log(78)
        res.send("ERROR");
        return;
    }
    else{
        console.log(92)
    userData.set(body.userName,{'password':body.password,'firstName':body.firstName,'lastName':body.lastName,'phNumber':body.phNumber})
    req.session.userName = body.userName;
    req.session.firstName = body.firstName;
    req.session.lastName = body.lastName;
    req.session.phNumber = body.phNumber;
    req.session.flow = req.body.flowChoice ? 'BUYER' : 'SELLER';
    res.send({status:"REGISTERED"})
}
})

app.get('/propertylist',(req,res)=> {
    if(req.session == undefined) {
        res.send("ERROR");
        return;
    }
    const reqS = req.session;
    if(propertyData.get('propertyList')==undefined)
        populateProperties();
    const propS = propertyData.get('propertyList');
    const sendData = {reqS ,propS};
    res.send({status:"OK",sendData})
})

app.post('/showinterest',(req,res) => {
    const data = req.body;
    var buyerData = req.session;
    if(buyerData.interests==undefined)
        buyerData.interests = {}
    const owner = data.OWNER; 
    console.log(owner)
    req.session.interests[data.ID] = (userData.get(owner)["phNumber"])
    sendMail(req.session.userName,owner,data.ID)
    res.send("ADDED")
})

app.get('/myproperty',(req,res) => {
    const userName = req.session.userName;
    var sendData = []
    for(i in propertyData.get('propertyList')) {
        if(propertyData.get('propertyList')[i].OWNER === userName)
            sendData.push(propertyData.get('propertyList')[i])
    }
    res.send({status:"DONE",sendData})
})

app.post('/addproperty',(req,res)=> {
    if(req.session.flow != 'SELLER') {
        res.send("FORBIDDEN FOR BUYER")
        return;
    }
    let property = propertyData.get('propertyList');
    var data = req.body;
    data.OWNER = req.session.userName;
    data.ID = property.length+1;
    property.push(data);
    propertyData.set('propertyList',property)
    let user = userData.get(req.session.userName);
    if(user.propertyList == undefined ) user.propertyList = [] 
    user.propertyList.push(req.body)
    res.send("SUCCESSFULLY ADDED")
})

app.post('/removeproperty',(req,res)=> {
    let property = propertyData.get('propertyList');
    const id = req.body.ID;
    var rem;
    console.log(171,id,req.body);
    if(req.session.flow != 'SELLER') {
        res.send("FORBIDDEN FOR BUYER")
        return;
    }
    for(var i in property) {
        if(property[i].ID === id )
            rem = i
    }
    if(req.session.userName != property[rem].OWNER){
        res.send("FORBIDDEN")
        return;
    }
    property = property.slice(0, rem).concat(property.slice(rem+1))
    propertyData.set('propertyList',property)
    res.send("SUCCESSFULLY ADDED")
})

app.get('/logout',(req,res) => {
    req.session.destroy()
    res.send("LOGOUT")
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });