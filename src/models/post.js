import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema({
  title: String,
  body: String,
  tags: [String],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  contributes: String,
  user: {
    _id: mongoose.Types.ObjectId,
    username: String,
  },
  avatar: String,
});

//모델 생성
const Post = mongoose.model('Post', PostSchema);
export default Post;
