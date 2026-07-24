import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import SiteShell from "../../components/public/SiteShell";
import { fetchBlogPosts, getApiBaseUrl, type BlogPostSummary } from "../../lib/publicApi";

type Props = {
  posts: BlogPostSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const pageSize = 12;
  const page = Math.max(1, Number(query.page || 1));
  const data = await fetchBlogPosts(getApiBaseUrl(), page, pageSize);
  return {
    props: {
      posts: data?.items ?? [],
      page,
      pageSize,
      totalCount: data?.pagination.totalCount ?? 0,
    },
  };
};

export default function BlogIndexPage({ posts, page, pageSize, totalCount }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageTitle =
    page > 1
      ? `LocalOnline Blog Page ${page} | Noida Extension Guides`
      : "LocalOnline Blog | Noida Extension, Gaur City & Crossing Republik Guides";

  const siteUrl = getSiteUrl();
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Read practical local guides for Noida Extension, Gaur City, Greater Noida West and Crossing Republik, including schools, retail, real estate and neighbourhood services."
        />
        <link rel="canonical" href={page > 1 ? `${siteUrl}/blog?page=${page}` : `${siteUrl}/blog`} />
        {page > 1 ? <link rel="prev" href={page === 2 ? `${siteUrl}/blog` : `${siteUrl}/blog?page=${page - 1}`} /> : null}
        {page < totalPages ? <link rel="next" href={`${siteUrl}/blog?page=${page + 1}`} /> : null}
      </Head>
      <SiteShell>
        <section className="pub-hero blog-hero">
          <p className="blog-kicker">LocalOnline Guides</p>
          <h1 className="pub-title">Neighbourhood insights for Noida Extension and Greater Noida West</h1>
          <p className="pub-subtitle">
            Practical, locally focused articles for residents comparing markets, schools,
            services, societies, and daily-life options around Gaur City, Crossing Republik,
            and nearby townships.
          </p>
        </section>

        {posts.length ? (
          <section className="blog-grid" aria-label="Latest blog posts">
            {posts.map((post) => (
              <article className="blog-card" key={post.slug}>
                {post.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.featuredImage} alt="" className="blog-card-image" loading="lazy" />
                ) : null}
                <div className="blog-card-body">
                  <p className="blog-meta">{formatDate(post.updatedAt)}</p>
                  <h2 className="blog-card-title">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="blog-excerpt">{post.excerpt}</p>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="pub-card blog-empty">
            <h2 className="pub-card-title">Local guides are being prepared</h2>
            <p className="pub-muted">
              Publish articles in the new <code>blog_posts</code> table and they will appear here,
              render as server HTML, and flow into the blog sitemap automatically.
            </p>
          </section>
        )}

        {totalPages > 1 ? (
          <nav className="blog-pagination" aria-label="Blog pagination">
            {page > 1 ? (
              <Link className="pub-page-link" href={page === 2 ? "/blog" : `/blog?page=${page - 1}`}>
                Previous
              </Link>
            ) : (
              <span className="pub-page-link is-disabled">Previous</span>
            )}
            <span className="blog-page-status">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link className="pub-page-link" href={`/blog?page=${page + 1}`}>
                Next
              </Link>
            ) : (
              <span className="pub-page-link is-disabled">Next</span>
            )}
          </nav>
        ) : null}
      </SiteShell>
    </>
  );
}
