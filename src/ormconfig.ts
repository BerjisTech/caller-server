import { DataSource } from 'typeorm';

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