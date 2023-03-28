import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import multer from "multer";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url"; //middleware and package configurations
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import cloudinary from 'cloudinary'

/* CONFIGURATION */ const __filename = fileURLToPath(import.meta.url); //converts a url to a path string
const __dirname = path.dirname(__filename);
dotenv.config(); // to use .env files
const app = express();
app.use(express.json()); //parses incoming json requests and parse it to the req.body
app.use(helmet()); // secures HTTP header returned by the express app
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // so that browser blocks no cors
app.use(morgan("common")); //it is used to log the requests with info in terminal
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});
app.use("/assets", express.static(path.join(__dirname, "public/assets"))); //to store the images

/* ROUTES */

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);

/* MONGOOSE SETUP */

const PORT = process.env.PORT || 6001;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Listening on PORT: ${PORT}. Connected to MongoDB`);
    });
  })
  .catch((err) => {
    console.log(`${err}, did not connect.`);
  });
