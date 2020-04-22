/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
const path = require(`path`)
const slash = require(`slash`)
const _get = require(`lodash/get`)

exports.createPages = ({ graphql, actions }) => {
	const { createPage } = actions
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
							colorBackground
							colorPrimary
							colorSecondary
							bannerIcons {
                file {
                  url
                }
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
			// Resolve the paths to our template
			const articleTemplate = path.resolve('./src/template/article-template.js')
			// Then for each result we create a page.
			result.data.allContentfulArticle.edges.forEach((edge) => {
				createPage({
					path: `/articles/${_get(edge, 'node.slug')}/`,
					component: slash(articleTemplate),
					context: {
						slug: _get(edge, 'node.slug'),
						id: _get(edge, 'node.id'),
						title: _get(edge, 'node.title'),
						subTitle: _get(edge, 'node.subTitle'),
						tags: _get(edge, 'node.tags'),
						colorBackground: _get(edge, 'node.colorBackground'),
						colorPrimary: _get(edge, 'node.colorPrimary'),
						colorSecondary: _get(edge, 'node.colorSecondary'),
						bannerIcons: _get(edge, 'node.bannerIcons'),
						heroImage: _get(edge, 'node.heroImage'),
						main: _get(edge, 'node.main.json')
					}
				})
			})
		})
		.catch((error) => {
			console.log('Error retrieving contentful data', error)
		})
}
