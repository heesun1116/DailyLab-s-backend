import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const UserSchema = new Schema({
  username: String,
  hashedPassword: String,
  avatar: String
}); //인스턴슨 메서드 생성

UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
}; //스태틱 메서드 생성


UserSchema.statics.findByUsername = function (username) {
  return this.findOne({
    username
  });
}; //serialize 인스턴스생성


UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
}; // 토큰 발급하기


UserSchema.methods.generateToken = function () {
  const token = jwt.sign( //첫번째 파라미터에는 토큰 안에 넣고 싶은 데이터를 넣음
  {
    _id: this.id,
    username: this.username
  }, process.env.JWT_SECRET, //두번째 파라미터는 JWT 암호를 사용
  {
    expiresIn: '7d' //7일 동안 사용함.

  });
  return token;
};

const User = mongoose.model('User', UserSchema);
export default User;