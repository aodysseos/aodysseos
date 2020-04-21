const activeEnv = process.env.GATSBY_ACTIVE_ENV || process.env.NODE_ENV || 'development'
console.log(`Using environment config: '${activeEnv}'`)
require('dotenv').config({ path: `.env.${activeEnv}` })

module.exports = {
	siteMetadata: {
		title: `Andreas Odysseos`,
		description: `Andreas Odysseos portfolio site`,
		author: `@gatsbyjs`
	},
	plugins: [
		`gatsby-plugin-styled-components`,
		`gatsby-plugin-transition-link`,
		`gatsby-plugin-react-helmet`,
		{
			resolve: `gatsby-source-filesystem`,
			options: {
				name: `images`,
				path: `${__dirname}/src/images`
			}
		},
		`gatsby-transformer-sharp`,
		`gatsby-plugin-sharp`,
		{
			resolve: 'gatsby-plugin-react-svg',
			options: {
				rule: {
					include: `${__dirname}/src/assets`
				}
			}
		},
		{
			resolve: `gatsby-plugin-manifest`,
			options: {
				name: `gatsby-starter-default`,
				short_name: `starter`,
				start_url: `/`,
				background_color: `#663399`,
				theme_color: `#663399`,
				display: `minimal-ui`,
				icon: `src/images/gatsby-icon.png` // This path is relative to the root of the site.
			}
		},
		{
			resolve: `gatsby-plugin-prefetch-google-fonts`,
			options: {
				fonts: [
					{
						family: `Montserrat`,
						variants: [ `300`, `400`, `800` ]
					}
				]
			}
		},
		{
			resolve: `gatsby-source-contentful`,
			options: {
				spaceId: process.env.GATSBY_CONTENTFUL_SPACE_ID,
				accessToken: process.env.GATSBY_CONTENTFUL_ACCESS_TOKEN,
				richText: { resolveFieldLocales: true }
			}
		}
		// this (optional) plugin enables Progressive Web App + Offline functionality
		// To learn more, visit: https://gatsby.dev/offline
		// `gatsby-plugin-offline`,
	]
}
