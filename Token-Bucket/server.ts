import  express  from "express";
import { rateLimitter } from "./tokenBucket";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(rateLimitter);

app.get("/api", (req,res) =>{
    res.json({message: "Request Successfull"});
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});