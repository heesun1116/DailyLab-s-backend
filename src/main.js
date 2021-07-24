require('dotenv').config();
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
//서버와 데이터베이스의 연결
import mongoose from 'mongoose';

import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';

const app = new Koa();
const router = new Router();

const { PORT, MONGO_URI } = process.env;

//Server to Database
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useFindAndModify: false })
  .then(() => {
    console.log('Connected to MongoDb');
  })
  .catch((e) => {
    console.error(e);
  });

//router settings

router.use('/api', api.routes()); //appi route applied

//Apply bodyParser before applying router

app.use(bodyParser());
app.use(jwtMiddleware);

//app Apply Router to Instance
app.use(router.routes()).use(router.allowedMethods());

//Use 4000 if no PORT is specified

const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listenging to port %d', port);
});
