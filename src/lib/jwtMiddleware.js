import jwt from 'jsonwebtoken';
import User from '../models/user';

// To validate tokens
const jwtMiddleware = async (ctx, next) => {
  const token = ctx.cookies.get('access_token');
  if (!token) return next(); //No tokens
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    ctx.state.user = {
      _id: decoded._id,
      username: decoded.username,
    };
    //If the remaining protection period of the token is less than 3.5 days, reissue it.
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 60 * 60 * 24 * 3.5) {
      const user = await User.findById(decoded._id);
      const token = user.generateToken();
      ctx.cookies.set('access_token', token, {
        maxAge: 100 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });
    }
    return next();
  } catch (e) {
    return next();
  }
};

export default jwtMiddleware;
