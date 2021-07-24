import Post from '../../models/post';
import mongoose from 'mongoose';
import Joi from 'joi';
import sanitizeHtml from 'sanitize-html';

const { ObjectId } = mongoose.Types;
// HTML 태그 없애기
const sanitizeOption = {
  allowedTags: [
    'h1',
    'h2',
    'b',
    'i',
    'u',
    's',
    'p',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};
const removeHtmlAndShorten = (body) => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 200 ? filtered : `${filtered.slice(0, 200)}...`;
};

export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!ObjectId.isValid(id)) {
    ctx.status = 400; // Bad Request
    return;
  }
  try {
    const post = await Post.findById(id);
    //when post does not exist
    if (!post) {
      ctx.status = 404; // Not Found
      return;
    }
    ctx.state.post = post;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};

/*
  POST /api/posts
  {
    title: 'title',
    body: 'content',
    tags: ['tag1', 'tag2']
    contributes: 'value'
  }
*/
export const write = async (ctx) => {
  const schema = Joi.object().keys({
    // Validate that an object has the following fields
    title: Joi.string().required(), // required() required items
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
    contributes: Joi.string().required(),
    avatar: Joi.string().required(),
  });
  // After verification, error processing in case of verification failure
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }

  const { title, body, tags, contributes, avatar } = ctx.request.body;
  const post = new Post({
    title,
    body: sanitizeHtml(body, sanitizeOption),
    tags,
    contributes,
    user: ctx.state.user,
    avatar,
  });
  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/posts?username=&tag=&page=
*/
export const list = async (ctx) => {
  const page = parseInt(ctx.query.page || '1', 10);

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  const { tag, username } = ctx.query;
  // tag, put in object if username value is valid, or not
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: tag } : {}),
  };

  try {
    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean()
      .exec();
    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(postCount / 10));
    ctx.body = posts.map((post) => ({
      ...post,
      body: removeHtmlAndShorten(post.body),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  GET /api/posts/:id
*/
export const read = async (ctx) => {
  ctx.body = ctx.state.post;
};

/*
  DELETE /api/posts/:id
*/
export const remove = async (ctx) => {
  const { id } = ctx.params;
  try {
    await Post.findByIdAndRemove(id).exec();
    ctx.status = 204; // No Content (성공은 했지만 응답할 데이터는 없음)
  } catch (e) {
    ctx.throw(500, e);
  }
};

/*
  PATCH /api/posts/:id
  {
    title: 'rewrite',
    body: 'rewrite Content',
    tags: ['rewrite', 'tag']
    contributes: 'rewrite',
  }
*/
export const update = async (ctx) => {
  const { id } = ctx.params;
  // Similar to schema used by write, no required().
  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    contributes: Joi.string().required(),
  });

  // After verification, error processing in case of verification failure
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }
  const nextData = { ...ctx.requet.body };
  //Copy object and filter html if body value is given
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body, sanitizeOption);
  }
  try {
    const post = await Post.findByIdAndUpdate(id, nextData, {
      new: true, // setting this value returns updated data
      //If false, returns data before it is updated.
    }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};
