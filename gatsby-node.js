/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it

exports.createPages = ({ actions }) => {
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
  const articles = _.map(
    _.get(data, "allContentfulArticle.edges", []),
    ({ node }) => node
  );
  const { createPages } = actions;
  articles.forEach(article => {
    createPages({
      path: `/${article.id}`,
      component: require.resolve(`./src/templates/article.js`),
      context: { article }
    });
  });
};
