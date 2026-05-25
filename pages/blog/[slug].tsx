import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import SectionCard from "../../components/public/SectionCard";
import SeoLinkSections from "../../components/public/SeoLinkSections";
import SiteShell from "../../components/public/SiteShell";
import {
  fetchBlogPost,
  fetchHomeData,
  getApiBaseUrl,
  type BlogPost,
  type RelatedLinks,
} from "../../lib/publicApi";

type Props = {
  post: BlogPost;
  links: RelatedLinks;
};

const emptyLinks: RelatedLinks = {
  cities: [],
  areas: [],
  categories: [],
  placeTypes: [],
  places: [],
};

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://localonline.in").replace(/\/+$/, "");
}

function sanitizeHtml(html: string) {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const apiBaseUrl = getApiBaseUrl();
  const [post, homeData] = await Promise.all([
    fetchBlogPost(apiBaseUrl, slug),
    fetchHomeData(apiBaseUrl),
  ]);

  if (!post) {
    return { notFound: true };
  }

  return {
    props: {
      post: {
        ...post,
        content: sanitizeHtml(post.content),
      },
      links: homeData
        ? {
            cities: homeData.topCities,
            categories: homeData.topCategories,
            areas: homeData.topAreas,
            placeTypes: homeData.topPlaceTypes,
            places: [],
          }
        : emptyLinks,
    },
  };
};

export default function BlogPostPage({ post, links }: Props) {
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const image = post.featuredImage || `${siteUrl}/local-online-logo.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [image],
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: canonicalUrl,
    author: {
      "@type": "Person",
      name: post.authorName || "LocalOnline Editor",
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "LocalOnline",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/local-online-logo.png`,
      },
    },
  };

  return (
    <>
      <Head>
        <title>{`${post.title} | LocalOnline Blog`}</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={image} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <SiteShell>
        <article className="blog-post">
          <nav className="pub-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/blog">Blog</Link> / <span>{post.title}</span>
          </nav>
          <header className="blog-post-header">
            <p className="blog-meta">
              {formatDate(post.updatedAt)}
              {post.authorName ? ` by ${post.authorName}` : ""}
            </p>
            <h1>{post.title}</h1>
            <p className="blog-lede">{post.excerpt}</p>
            {post.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.featuredImage} alt="" className="blog-featured-image" />
            ) : null}
          </header>
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
        <SectionCard title="Explore Local Search Paths">
          <SeoLinkSections links={links} />
        </SectionCard>
      </SiteShell>
    </>
  );
}
