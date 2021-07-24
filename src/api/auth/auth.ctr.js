import Joi from 'joi';
import User from '../../models/user';

//Regiser
export const register = async (ctx) => {
  // Request verifying body
  const schema = Joi.object().keys({
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
    avatar: Joi.string().required(),
  });
  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }
  //Register
  const { username, password, avatar } = ctx.request.body;
  try {
    // Confirm existing the username
    const exists = await User.findByUsername(username);
    if (exists) {
      ctx.status = 409;
      return;
    }
    const user = new User({
      username,
      avatar,
    });
    await user.setPassword(password); // Password Settings
    await user.save(); //Save to Database
    // Remove the hashedPassword field from the data you want to respond to

    ctx.body = user.serialize();

    //  issue tokens
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 100 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

//Login
export const login = async (ctx) => {
  const { username, password } = ctx.request.body;

  //Error handling if username, password does not exist
  if (!username || !password) {
    ctx.status = 401;
    return;
  }

  try {
    const user = await User.findByUsername(username);
    //Error handling if account does not exist
    if (!user) {
      ctx.status = 401;
      return;
    }

    const valid = await user.checkPassword(password);
    //wrong password
    if (!valid) {
      ctx.status = 401;
      return;
    }
    ctx.body = user.serialize();
    // issue Token
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 100 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

//로그인 상태 확인
export const check = async (ctx) => {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};

//로그아웃
export const logout = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204;
};
