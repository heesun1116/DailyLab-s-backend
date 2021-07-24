import Post from './models/post';

export default function createFakeData() {
  const posts = [...Array(40).keys()].map((i) => ({
    title: `포스트 #${i}`,
    body: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam dolores similique consectetur temporibus, corporis inventore tempora ad nulla alias. Sed, dignissimos? Quas nobis doloribus, sequi sit eligendi dicta blanditiis fugiat?',
    tags: ['가짜', '데이터'],
  }));
  Post.insertMany(posts, (err, docs) => {
    console.log(docs);
  });
}
