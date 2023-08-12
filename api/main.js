
console.log('######\tStarting Theresa\'s API...');

import dotenv from 'dotenv';
import { connect } from './connector.js';
import Express  from 'express';
import multer from 'multer';

dotenv.config();
export var mysqlConnection, usersCache;
export const storageLocation = process.env.storageLocation;
export const port = 42847;
export const app = Express();
export const upload = multer();
export const corsOptions = {
    origin : [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://192.168.1.40:5500',
        'http://localhost'
    ],
    optionsSuccessStatus : 200,
    methods : ['GET', 'POST', 'PUT', 'DELETE']
};

connect();

export function setMysqlConn(value) { mysqlConnection = value; }
export function setUsersCache(value) { usersCache = value; }
export function pushUsersCache(value) { usersCache.push(value); }