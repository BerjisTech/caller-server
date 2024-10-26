import "reflect-metadata";
import { DataSource } from "typeorm";
import express from "express";
import { errorHandler } from "./helpers/errorHandler";

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'caller-db',
  port: 5432,
  username: 'caller_sim2',
  password: 'caller_sim2_password',
  database: 'caller_sim2_development',
  synchronize: true,
  logging: false,
  entities: [
    'src/entity/**/*.ts'
  ],
  migrations: [
    'src/migration/**/*.ts'
  ],
  subscribers: [
    'src/subscriber/**/*.ts'
  ],
});

const app = express();
app.use(express.json());

// Import and use controllers here
// Example: app.use('/media-streams', mediaStreamRouter);

app.use(errorHandler);

AppDataSource.initialize().then(() => {
  app.listen(3006, () => {
    console.log("Server is running on port 3006");
  });
}).catch((error: any) => console.log("TypeORM connection error: ", error));