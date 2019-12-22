import React from "react";
import { Link } from "gatsby";
import _ from "lodash";
import { useStaticQuery, graphql } from "gatsby";

import Layout from "../components/layout";
import SEO from "../components/seo";
import Article from "../components/Article";

const Blog = () => {
  const data = useStaticQuery(graphql`
    {
      allContentfulArticle {
        edges {
          node {
            id
            title
            category {
              id
            }
            main {
              json
            }
            bannerImage {
              file {
                url
                fileName
                contentType
              }
            }
          }
        }
      }
    }
  `);
  const articles = _.get(data, "allContentfulArticle.edges", []);

  return (
    <Layout>
      <SEO title="" />
      <h1>Blog</h1>
      <p>Welcome to blog</p>
      {_.map(articles, ({ node }) => {
        console.log(node);
        return (
          <Link key={node.id} to={`/blog/${node.id}`}>
            {node.title}
          </Link>
        );
        // return <Article key={node.id} {...node} />;
      })}
      <Link to="/">Go back to the homepage</Link>
    </Layout>
  );
};

export default Blog;
