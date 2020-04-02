/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
const path = require(`path`)
const slash = require(`slash`)

exports.createPages = ({ graphql, actions }) => {
	const { createPage } = actions
	// we use the provided allContentfulBlogPost query to fetch the data from Contentful
	return graphql(
		`
      {
        allContentfulArticle {
          edges {
            node {
              slug
              title
              subTitle
              tags {
                name
                id
              }
              heroImage {
                file {
                  url
                }
              }
              main {
                json
              }
            }
          }
        }
      }
    `
	)
		.then((result) => {
			if (result.errors) {
				console.log('Error retrieving contentful data', result.errors)
			}
			console.log({ result })
			// Resolve the paths to our template
			const articleTemplate = path.resolve('./src/template/article-template.js')
			// Then for each result we create a page.
			result.data.allContentfulArticle.edges.forEach((edge) => {
				createPage({
					path: `/articles/${edge.node.slug}/`,
					component: slash(articleTemplate),
					context: {
						slug: edge.node.slug,
						id: edge.node.id,
						title: edge.node.title,
						subTitle: edge.node.subTitle,
						tags: edge.node.tags,
						heroImage: edge.node.heroImage,
						main: edge.node.main.json
					}
				})
			})
		})
		.catch((error) => {
			console.log('Error retrieving contentful data', error)
		})
}
