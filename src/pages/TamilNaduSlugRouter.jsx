import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { categoryService } from '../services/articleService';
import Loading from '../components/Loading';
import DistrictPage from './DistrictPage';
import Article from './Article';

/**
 * `/tamil-nadu/:slug` is shared by district list pages and Tamil Nadu articles.
 * Resolve district first; otherwise render the article page.
 */
const TamilNaduSlugRouter = () => {
  const { articleSlug, district, slug: paramSlug } = useParams();
  const slug = articleSlug || district || paramSlug;
  const [mode, setMode] = useState('loading'); // loading | district | article

  useEffect(() => {
    if (!slug) {
      setMode('article');
      return undefined;
    }

    let cancelled = false;
    setMode('loading');

    categoryService
      .getAll({ districts: 'true' })
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.data || [];
        const isDistrict = list.some((d) => d.slug === slug);
        setMode(isDistrict ? 'district' : 'article');
      })
      .catch(() => {
        if (!cancelled) setMode('article');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (mode === 'loading') return <Loading />;
  if (mode === 'district') return <DistrictPage />;
  return <Article />;
};

export default TamilNaduSlugRouter;
