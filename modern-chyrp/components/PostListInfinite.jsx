import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import api from '../utils/api';
import PostItem from './PostItem';
import { motion } from 'framer-motion';

export default function PostListInfinite() {
  const { ref, inView } = useInView();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [canObserve, setCanObserve] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) =>
      api.get(`/posts?page=${pageParam}`).then((res) => res.data),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const timeout = setTimeout(() => setCanObserve(true), 500); // delay observer
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (inView && hasNextPage) {
      if (hasLoadedOnce) {
        fetchNextPage();
      } else {
        setHasLoadedOnce(true);
      }
    }
  }, [inView, hasNextPage, fetchNextPage, hasLoadedOnce]);

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      {data?.pages.map((page, pi) => (
        <motion.div key={pi} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {page.posts.map((post, idx) => (
            <PostItem key={`${post.id}-${pi}-${idx}`} post={post} />
          ))}
        </motion.div>
      ))}
      {canObserve && (
        <div ref={ref} className="text-center py-4">
          {isFetchingNextPage ? 'Loading more...' : hasNextPage ? '' : 'No more posts'}
        </div>
      )}
    </div>
  );
}
