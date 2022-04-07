// Import mysql for database connections and express for Hosting 
const mysql  = require("mysql");
const express = require("express");
const app = express();


//Import body parser to parse requests of API endpoints

let bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Connect to database in Amazon AWS RDS
const db = mysql.createConnection({
    host: "database1.cpdmkc3lyqh2.us-east-1.rds.amazonaws.com",
    port: "3306",
    user: "admin",
    password: "admin123",
    database: "myfirstdb"
});

//Report any connection errors
db.connect((err) => {
    if(err){
        console.log(err);
        return;
    }
    console.log("Database connected");
});

app.get('/',(req,res) =>  res.send("helo hari!"));


//=================================API end point for adding a book to books table===========================
app.post("/books",(req,res) =>{
    let body = req.body;
    let sql = 'INSERT INTO books SET ?';
    let book = {
        isbn: req.body.ISBN,
        title: req.body.title,
        author: req.body.Author,
        description: req.body.description,
        genre: req.body.genre,
        price: req.body.price,
        quantity: req.body.quantity
        };

        //Check for presence of all the parameters
        if(! ("ISBN" in req.body) || ! ("title" in req.body) || ! ("Author" in req.body) || ! ("description" in req.body) || !("genre" in req.body) || !("price" in req.body) || !("quantity" in req.body)){
            res.status(400).json({
                statusCode: 400,
                message : "Missing parameters in the input"
            });
        }

        //check for valid price
        else if("price" in book){
            let priceAsString = req.body["price"].toString().split(".");
            if(isNaN(req.body.price)){
                res.status(400).json({
                    statusCode: 400,
                    message : "Invalid book price"
                });
            }
            else if (priceAsString.length > 2 || ( priceAsString.length ==2  && ! (priceAsString[1].length ==2 || priceAsString[1].length ==1 || priceAsString[1].length ==0) ) ){
                res.status(400).json({
                    statusCode: 400,
                    message : "Invalid book price"
                });
                console.log(priceAsString.length, priceAsString[1].length,priceAsString);
            
            }

            else{
                //Check for valid book quantity
                if(isNaN(req.body.quantity) || !Number.isInteger(req.body.quantity)){
                    res.status(400).json({
                        statusCode: 400,
                        message : "Invalid book quantity. It must be an integer"
                    });
                }
                else{
                    let query = db.query(sql,book, (err,res1) => {
                        if(err) {
                            //Check for duplicate entries 
                            if (err.code.localeCompare('ER_DUP_ENTRY') == 0){
                                console.log("Entry exits");
                                res.status(422).json({
                                        statusCode: 422,
                                        message : "This ISBN already exists in the system"
                                    });
                            }
                            else{
                                res.status(500).json({
                                    statusCode: 500,
                                    message : "Server error!"
                                });
                            }
                        }
                        else{
    
                            //Return response for successful insertion
                            res.status(201).json({
                                "ISBN": req.body.ISBN,
                                "title": req.body.title,
                                "Author": req.body.Author,
                                "description": req.body.description,
                                "genre": req.body.genre,
                                "price": req.body.price,
                                "quantity": req.body.quantity
                        });
                        }
                    });
                }
            }

        }
});


//=================================API end point for updating a book to books table===========================
app.put('/books/:isbn',(req,res) =>{
    let sql = `SELECT * FROM books WHERE isbn = '${req.params.isbn}'`;
    let body = req.body;
    let query = db.query(sql, (err,result) => {
        if(err) {
            res.status(500).json({
                statusCode: 500,
                message : "Server error. Try again!"
            });
        }
        else{

            //Check for presence of the entry with given ISBN number
            if(result.length == 0){
                res.status(404).json({
                    statusCode: 404,
                    message : "ISBN not found"
                });
            }
            else{
                let book = {
                    isbn: req.body.ISBN,
                    title: req.body.title,
                    author: req.body.Author,
                    description: req.body.description,
                    genre: req.body.genre,
                    price: req.body.price,
                    quantity: req.body.quantity
                    };

                    //Check for presence of all the parameters
                    if(! ("title" in req.body) || ! ("Author" in req.body) || ! ("description" in req.body) || !("genre" in req.body) || !("price" in req.body) || !("quantity" in req.body)){
                        res.status(400).json({
                            statusCode: 400,
                            message : "Missing parameters in the input"
                        });
                    }

                    //check for valid price
                    else if("price" in book){
                        let priceAsString = book["price"].toString().split(".");
                        if (isNaN(req.body.price)){
                            res.status(400).json({
                                statusCode: 400,
                                message : "Invalid book price"
                            });
                        }
                        else if (priceAsString.length > 2 || ( priceAsString.length ==2  && ! (priceAsString[1].length ==2 || priceAsString[1].length ==1 || priceAsString[1].length ==0) ) || (isNaN(req.body.price))){
                            res.status(400).json({
                                statusCode: 400,
                                message : "Invalid book price"
                            });
                        
                        }
            
                        else{
                            //Check for valid book quantity
                            if(isNaN(req.body.quantity) || !Number.isInteger(req.body.quantity)){
                                res.status(400).json({
                                    statusCode: 400,
                                    message : "Invalid book quantity. It must be an integer"
                                });
                            }
                            else{
                                let fsql = `UPDATE books SET title = '${req.body.title}', author = '${req.body.Author}', description = '${req.body.description}', genre = '${req.body.genre}', price = '${req.body.price}', quantity = '${req.body.quantity}' where isbn = '${req.params.isbn}'`;

                                let query = db.query(fsql,(err,res1) => {
                                    if(err) {
                                            //Check for any other errors
                                            console.log(err.message);
                                            res.status(500).json({
                                                    statusCode: 500,
                                                    message : "Server error. Try again!"
                                                });
                                    }
                                    else{
                                        //Return response for successful updation
                                        res.status(200).json({
                                            "ISBN": req.body.ISBN,
                                            "title": req.body.title,
                                            "Author": req.body.Author,
                                            "description": req.body.description,
                                            "genre": req.body.genre,
                                            "price": req.body.price,
                                            "quantity": req.body.quantity
                                        });
                                    }
                                });
                            }
                        }
            
                    }
            }
        }
    });
});

//=================================API end point for retrieving a book from books table===========================
app.get('/books/isbn/:isbn',(req,res) =>{
    let sql = `SELECT * FROM books WHERE isbn = '${req.params.isbn}'`;
    let query = db.query(sql, (err,result) => {
        if(err) {
            res.status(500).json({
                statusCode: 500,
                message : "Server error"
            });
        }
        else{
            //Check for presence of the entry with given ISBN number
            if(result.length == 0){
                res.status(404).json({
                    statusCode: 404,
                    message : "ISBN not found"
                });
            }
            else{
                //Return response for successful retrieval
                res.status(200).json({
                                "ISBN": result[0].isbn,
                                "title": result[0].title,
                                "Author": result[0].author,
                                "description": result[0].description,
                                "genre": result[0].genre,
                                "price": result[0].price,
                                "quantity": result[0].quantity
                });
            }
        }
    });
});

//=================================API end point for retrieving a book from books table===========================

app.get('/books/:isbn',(req,res) =>{
    let sql = `SELECT * FROM books WHERE isbn = '${req.params.isbn}'`;
    let query = db.query(sql, (err,result) => {
        if(err) throw err;
        else{
            if(result.length == 0){
                //Check for presence of the entry with given ISBN number
                res.status(404).json({
                                "ISBN": result[0].isbn,
                                "title": result[0].title,
                                "Author": result[0].author,
                                "description": result[0].description,
                                "genre": result[0].genre,
                                "price": result[0].price,
                                "quantity": result[0].quantity
                });
            }
            else{
                //Return response for successful retrieval
                res.status(200).json({
                    statusCode: 200,
                    message : result[0]
                });
            }
        }
    });
});


//Function to validate email 

const validateEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };
  
//Array of all the US states for validation
const states = ["AL","AK","AS","AZ","AR","CA","CO","CT","DE","DC","FM","FL","GA","GU","HI","ID","IL","IN","IA","KS","KY","LA","ME","MH","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","MP","OH","OK","OR","PW","PA","PR","RI","SC","SD","TN","TX","UT","VT","VI","VA","WA","WV","WI","WY"];

//=================================API end point for adding a customer to customer table===========================
app.post("/customers",(req,res) =>{
    console.log("from 3000 host body is:",req.body);
    let body = req.body;
    let sql = 'INSERT INTO customers SET ?';
    let book = {
        userid: req.body.userId,
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        address2: req.body.address2,
        city: req.body.city,
        state: req.body.state,
        zipcode: req.body.zipcode
        };
        let sql2 = `SELECT * FROM customers WHERE userId = '${req.body.userId}'`;
        console.log(sql2)
    let query = db.query(sql2, (err,result) => {
        //Check for presence of all the parameters
        if(err){
            res.status(400).json({
                statusCode: 404,
                message : "Illegal, missing or malformed input"
            });
        }
        else{
            //Check for presence of userid in the system
            if(result.length != 0){
                res.status(422).json({
                    statusCode: 422,
                    message : "This user ID already exists in the system"
                });
            }
            else{
                //Check for presence of all the parameters
                if(! ("userId" in req.body) || ! ("name" in req.body) || ! ("phone" in req.body) || ! ("address" in req.body) || !("city" in req.body) || !("state" in req.body) || !("zipcode" in req.body)){
                    res.status(400).json({
                        statusCode: 400,
                        message : "Missing parameters in the input"
                    });
                }

                //Check for valid email and us state
                else if(! validateEmail(req.body.userId) || req.body.state.length != 2 || states.indexOf(req.body.state) == -1){
                    res.status(400).json({
                        statusCode: 400,
                        message : "Invalid state or userid, please check them!"
                    });
                }
        
                    else{
                        if (! ("address2" in req.body)){
                            req.body = {...req.body, "address2" : ""};
                        }
                        let query = db.query(sql,req.body, (err,res1) => {
                            if(err) {
                                //Check for presence of duplicate entries of customers
                                if (err.code.localeCompare('ER_DUP_ENTRY') == 0){
                                    console.log("Entry exits");
                                    res.status(422).json({
                                            statusCode: 422,
                                            message : "This user ID already exists in the system"
                                        });
                                }
                                else{
                                    res.status(500).json({
                                        statusCode: 500,
                                        message : "Server error!"
                                    });
                                }
                            }
                            else{
                                //Return response for successful insertion
                                let nsql = `SELECT * FROM customers where userId='${req.body.userId}'`;
                                let nq = db.query(nsql, (err,nres) => {
                                    res.status(201).json({
                                        "id":nres[0].id,
                                        "userId":nres[0].userId,
                                        "name":nres[0].name,
                                        "phone":nres[0].phone,
                                        "address":nres[0].address,
                                        "address2":nres[0].address2,
                                        "city":nres[0].city,
                                        "state":nres[0].state,
                                        "zipcode":nres[0].zipcode
                                    });
                                });
                            }
                        });
                    }

            }
            
        }
    });
});

//=================================API end point for retrieving a customer from customer table based on id===========================
app.get('/customers/:id',(req,res) =>{
    let sql = `SELECT * FROM customers WHERE id = ${req.params.id}`;
    let query = db.query(sql, (err,nres) => {
        if(err){
            //Check for presence of all the parameters
            res.status(400).json({
                statusCode: 400,
                message : "Illegal, missing or malformed input"
            });
        }
        else{
            if(nres.length == 0){
                //Return response in absence of a customer in the database
                res.status(404).json({
                    statusCode: 404,
                    message : "Customer not found"
                });
            }
            else{
                //Return response for successful retrieval
                res.status(200).json({
                                        "id":nres[0].id,
                                        "userId":nres[0].userId,
                                        "name":nres[0].name,
                                        "phone":nres[0].phone,
                                        "address":nres[0].address,
                                        "address2":nres[0].address2,
                                        "city":nres[0].city,
                                        "state":nres[0].state,
                                        "zipcode":nres[0].zipcode
                });
            }
        }
    });
});


//=================================API end point for retrieving a customer from customer table based on userid===========================
app.get('/customers',(req,res) =>{
    console.log("req from index",req.query.userId);
    let sql = `SELECT * FROM customers WHERE userId = '${req.query.userId}'`;
    let query = db.query(sql, (err,nres) => {
        if(err){
            //Check for presence of all the parameters
            console.log("error from index",err);
            res.status(400).json({
                statusCode: 400,
                message : "Illegal, missing or malformed input"
            });
        }
        else{
            if(nres.length == 0){
                //Return response in absence of a customer in the database
                res.status(404).json({
                    statusCode: 404,
                    message : "Customer not found"
                });
            }
            else{
                //Return response for successful retrieval
                res.status(200).json({
                                        "id":nres[0].id,
                                        "userId":nres[0].userId,
                                        "name":nres[0].name,
                                        "phone":nres[0].phone,
                                        "address":nres[0].address,
                                        "address2":nres[0].address2,
                                        "city":nres[0].city,
                                        "state":nres[0].state,
                                        "zipcode":nres[0].zipcode
                });
            }
        }
    });
});

//=================================API end point for retrieving all customers from customer table===========================
app.get('/customerall',(req,res) =>{
    let sql = `SELECT * FROM customers `;
    console.log(sql);
    let query = db.query(sql, (err,nres) => {
        if(err){
            console.log("err",err);
            res.status(400).json({
                statusCode: 404,
                message : "Illegal, missing or malformed input"
            });
        }
        else{
            if(result.length == 0){
                res.status(404).json({
                    statusCode: 404,
                    message : "Customer not found"
                });
            }
            else{
                res.status(200).json({
                                        "id":nres[0].id,
                                        "userId":nres[0].userId,
                                        "name":nres[0].name,
                                        "phone":nres[0].phone,
                                        "address":nres[0].address,
                                        "address2":nres[0].address2,
                                        "city":nres[0].city,
                                        "state":nres[0].state,
                                        "zipcode":nres[0].zipcode
                });
            }
        }
    });
});



app.listen('3000', () => {
    console.log("Server up on port 3001");
});




