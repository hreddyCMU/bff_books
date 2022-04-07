// Import mysql for database connections and express for Hosting 
const mysql  = require("mysql");
const express = require("express");
const app = express();
var axios = require('axios');


//Import body parser to parse requests of API endpoints

let bodyParser = require('body-parser');
const { response } = require("express");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let isUserAgentMobile = false;


app.get('/',(req,res) =>  res.send("helo hari! BFF for customer is up"));

let dateNow = new Date();

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




//=================================API end point for adding a book to books table===========================
app.post("/books",(req,res) =>{
    if(isValidJWTandUserAgent(req,res)){
        axios.post('http://localhost:3000/books', req.body)
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
        axios.put(`http://localhost:3000/books/${req.params.isbn}`, req.body)
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
        axios.get(`http://localhost:3000/books/isbn/${req.params.isbn}`, req.body)
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
        axios.get(`http://localhost:3000/books/${req.params.isbn}`, req.body)
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





app.listen('80', () => {
    console.log("BFF customer service up on Port 80");
});




