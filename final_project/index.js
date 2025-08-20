const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
    if (!req.session || !req.session.authorization) {
        return res.status(403).json({ message: "User not logged in" });
      }
    
      const token = req.session.authorization.accessToken;
      if (!token) {
        return res.status(403).json({ message: "Access token missing" });
      }
    
      // Verify the JWT; use the SAME secret you used when signing (commonly "access")
      jwt.verify(token, "access", (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Invalid or expired token" });
        }
        // Attach user info to the request for downstream handlers if needed
        req.user = decoded;
        return next();
      });
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
