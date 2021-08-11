import Router from 'koa-router';
import checkLoggedIn from '../../lib/checkLoggedIn';
import * as postCtrl from './post.ctrl';
const posts = new Router();
posts.get('/', postCtrl.list); //request information

posts.post('/', checkLoggedIn, postCtrl.write);
const post = new Router(); // api/posts/:id

post.get('/', postCtrl.read);
post.delete('/', checkLoggedIn, postCtrl.checkOwnPost, postCtrl.remove);
post.patch('/', checkLoggedIn, postCtrl.checkOwnPost, postCtrl.update);
posts.use('/:id', postCtrl.getPostById, post.routes());
export default posts;