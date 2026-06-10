import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import PostCard from '../components/blog/PostCard';

export default function CategoryPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      const cat = data.categories.find((c) => c.slug === slug);
      if (cat) {
        setCategory(cat);
        api.get(`/posts?category=${cat._id}&limit=10`).then(({ data }) => {
          setPosts(data.posts);
          setHasNext(data.pagination.hasNext);
        });
      }
    }).finally(() => setLoading(false));
  }, [slug]);

  const loadMore = async () => {
    const nextPage = page + 1;
    const { data } = await api.get(`/posts?category=${category._id}&page=${nextPage}&limit=10`);
    setPosts((prev) => [...prev, ...data.posts]);
    setHasNext(data.pagination.hasNext);
    setPage(nextPage);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {category && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-8 rounded-full" style={{ backgroundColor: category.color }} />
            <h1 className="text-2xl font-bold">{category.name}</h1>
          </div>
          {category.description && <p className="text-gray-500 text-sm">{category.description}</p>}
          <p className="text-sm text-gray-400 mt-1">{posts.length} posts</p>
        </div>
      )}
      <div className="space-y-4">
        {posts.map((post) => <PostCard key={post._id} post={post} />)}
        {posts.length === 0 && <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📂</p><p>No posts in this category</p></div>}
      </div>
      {hasNext && (
        <button onClick={loadMore} className="w-full mt-6 btn-outline py-3 text-sm">Load more</button>
      )}
    </div>
  );
}
