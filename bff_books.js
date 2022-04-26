// Import mysql for database connections and express for Hosting
const mysql  = require("mysql");
const express = require("express");
const app = express();
var axios = require('axios');
const CircuitBreaker = require('opossum');
const { Kafka } = require('kafkajs');


//Import body parser to parse requests of API endpoints

let bodyParser = require('body-parser');
const { response } = require("express");
const res = require("express/lib/response");
let isbn;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let isUserAgentMobile = false;

function asyncFunctionThatCouldFail() {
    console.log("async function called");
    return new Promise((resolve, reject) => {
        // Do something, maybe on the network or a disk
        axios.get(`http://54.164.102.184/recommended-titles/isbn/${isbn}`)
            .then(function (response) {
                resolve(response.data);
            })
            .catch(function (error) {
                console.log("promise rejected", error);
            })
    });
}

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['b-2.msktutorialcluster.ggwq42.c23.kafka.us-east-1.amazonaws.com:9092', 'b-1.msktutorialcluster.ggwq42.c23.kafka.us-east-1.amazonaws.com:9092','b-3.msktutorialcluster.ggwq42.c23.kafka.us-east-1.amazonaws.com:9092'],
    ssl: false
  });
let dateNow = new Date();

const options = {
    timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 1, // When 50% of requests fail, trip the circuit
    resetTimeout: 60000 // After 60 seconds, try again.
};

const breaker = new CircuitBreaker(asyncFunctionThatCouldFail, options);
breaker.on('success',
    (result, res) => "Success" + result);
breaker.on('open',
    (res) => { console.log("hari breaker is open", res) });
breaker.fallback((response) => "dfdf" + response);

app.get('/',(req,res) =>  res.send("helo hari! BFF for customer is up"));

//Function to validate user information
const isValidJWTandUserAgent = (req,res) => {
    isUserAgentMobile = false;
    if(req.headers["user-agent"] === undefined){
        res.status(400).json({
            statusCode: 400,
            message : "User agent is not present in the request"
        });
        return false;
    }
    if(req.headers.authorization === undefined){
        res.status(401).json({
            statusCode: 401,
            message : "Absence of JWT token detected"
        });
        return false;
    }
    console.log(req.headers["user-agent"]);
    let base64Url = req.headers.authorization.split('.')[1]; // token you get
    let base64 = base64Url.replace('-', '+').replace('_', '/');
    let decodedData = JSON.parse(Buffer.from(base64, 'base64').toString('binary'));


    if(decodedData["sub"] === undefined || decodedData["exp"] === undefined || decodedData["iss"] === undefined){
        res.status(401).json({
            statusCode: 401,
            message : "Invalid JWT token detected"
        });
        return false;
    }
    else if(decodedData["sub"] !== undefined && !(decodedData["sub"] === "starlord" || decodedData["sub"] === "gamora" || decodedData["sub"] === "drax" || decodedData["sub"] === "rocket" || decodedData["sub"] === "groot" )){
        res.status(401).json({
            statusCode: 401,
            message : "Invalid JWT token detected"
        });
        return false;
    }
    else if(decodedData["iss"] !== undefined && decodedData["iss"] !== "cmu.edu"){
        res.status(401).json({
            statusCode: 401,
            message : "Invalid JWT token detected"
        });
        return false;
    }


    else if(decodedData["exp"] !== undefined && dateNow > Date(decodedData["exp"])){
        res.status(401).json({
            statusCode: 401,
            message : "Token expired"
        });
        return false;
    }
    if (req.headers["user-agent"].includes("Mobile")){
        isUserAgentMobile = true;
    }
    return true;
  };


  const sendEmail = async (response) => {

    const producer = kafka.producer()
await producer.connect()
await producer.send({topic: "MSKTutorialTopic", messages: [{value: response.data.name+" "+response.data.userId}] });

const consumer = kafka.consumer({ groupId: 'testgrp'});

await consumer.connect()
await consumer.subscribe({ topic: 'MSKTutorialTopic', fromBeginning: true })

await consumer.run({
 eachMessage: async ({ topic, partition, message }) => {
   console.log({
     value: message
   })
 },
});

}

//=================================API end point for adding a book to books table===========================
app.post("/books",(req,res) =>{
    if(isValidJWTandUserAgent(req,res)){
        axios.post('http://35.172.143.215:3000/books', req.body)
          .then(function (response) {
            res.status(response.status).json({
                ...response.data
            });
          })
          .catch(function (error) {
            //   console.log(error);
            if(error){
                res.status(error.response.status).json({
                    ...error.response.data
                });
             }
          });

    }
});

//=================================API end point for updating a book to books table===========================
app.put('/books/:isbn',(req,res) =>{
    if(isValidJWTandUserAgent(req,res)){
        axios.put(`http://35.172.143.215:3000/books/${req.params.isbn}`, req.body)
          .then(function (response) {
            res.status(response.status).json({
                ...response.data
            });
          })
          .catch(function (error) {
            if(error){
                res.status(error.response.status).json({
                    ...error.response.data
                });
             }
          });

    }
});


//=================================API end point for retrieving a book from books table===========================
app.get('/books/isbn/:isbn',(req,res) =>{
    if(isValidJWTandUserAgent(req,res)){
        axios.get(`http://35.172.143.215:3000/books/isbn/${req.params.isbn}`, req.body)
          .then(function (response) {
            if(isUserAgentMobile && response.status == 200 && response.data.genre === "non-fiction"){
                res.status(response.status).json({
                    "ISBN": response.data.ISBN,
                    "title": response.data.title,
                    "Author": response.data.Author,
                    "description": response.data.description,
                    "genre": 3,
                    "price": response.data.price,
                    "quantity": response.data.quantity
                });
            }
            else{
                res.status(response.status).json({
                    ...response.data
                });
            }
          })
          .catch(function (error) {
            if(error){
                res.status(error.response.status).json({
                    ...error.response.data
                });
             }
          });

    }
});

//=================================API end point for retrieving a book from books table===========================

app.get('/books/:isbn',(req,res) =>{
    if(isValidJWTandUserAgent(req,res)){
        axios.get(`http://35.172.143.215:3000/books/${req.params.isbn}`, req.body)
          .then(function (response) {
              console.log(response);
            if(isUserAgentMobile && response.status === 200 &&  response.data.genre === "non-fiction"){
                res.status(response.status).json({
                    "ISBN": response.data.ISBN,
                    "title": response.data.title,
                    "Author": response.data.Author,
                    "description": response.data.description,
                    "genre": 3,
                    "price": response.data.price,
                    "quantity": response.data.quantity
                });
            }
            else{
                res.status(response.status).json({
                    ...response.data
                });
            }
          })
          .catch(function (error) {
             if(error){
                res.status(error.response.status).json({
                    ...error.response.data
                });
             }
          });

    }
});
app.get("/status",(req,res) => {
    res.set('content-type', 'text/plain');
    res.send('OK');
    });
    
                //API endpoint for recommended books
             app.get("/books/:isbn/related-books", (req, resp) => {
        isbn = req.params.isbn;
        breaker.fire()
            .then((res) => {
                console.log("from up ", res);
                if (res.includes("Timed out")) {
                    resp.status(504).json({
                        "message": "Timed out!"
                    });
                }
                else if (res.includes("open")) {
                    resp.status(503).json({
                        "message": "Breaker is open"
                    });
                }
                else {
                    if(typeof(res) === "string"){
                        resp.status(204).send(res);
                    }
                    else{
                        let arr = [];
                        res.forEach((r,i)=> {
                            let ares = {}
                            ares["ISBN"] = r.isbn;
                            ares["title"] = r.title;
                            ares["Author"] = r.authors;
                            arr.push(ares);
                        });
                        resp.status(200).send(arr);
                    }
                }
            })
            .catch((err) => { console.log("from down err", err) });
    });
    
    app.get("/books/:isbn/related-books", (req, resp) => {
        isbn = req.params.isbn;
        breaker.fire()
            .then((res) => {
                console.log("from up ", res);
                if (res.includes("Timed out")) {
                    resp.status(504).json({
                        "message": "Timed out!"
                    });
                }
                else if (res.includes("open")) {
                    resp.status(503).json({
                        "message": "Breaker is open"
                    });
                }
                else {
                    if(typeof(res) === "string"){
                        resp.status(204).send(res);
                    }
                    else{
                        let arr = [];
                        res.forEach((r,i)=> {
                            let ares = {}
                            ares["ISBN"] = r.isbn;
                            ares["title"] = r.title;
                            ares["Author"] = r.authors;
                            arr.push(ares);
                        });
                        resp.status(200).send(arr);
                    }
                }
            })
            .catch((err) => { console.log("from down err", err) });
    });
    
    app.listen('80', () => {
        console.log("BFF  books service up on Port 80");
    });
        
