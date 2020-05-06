import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import styled from 'styled-components'
import _ from 'lodash'

import Layout from '../components/layout'
import SEO from '../components/seo'
import Banner from '../components/Banner'
import ArticlesContainer from '../components/Article/ArticlesContainer'

import vars from '../styles/vars'
import media from '../styles/media'

const Container = styled.div`
	padding: 0 ${vars.gap.mobile};
	${media.greaterThan('tablet')`
			padding: 0 ${vars.gap.tablet};
		`};
	${media.greaterThan('desktop')`
			padding: 0 ${vars.gap.desktop};
		`};
`

const Articles = () => {
	const data = useStaticQuery(graphql`
		{
			allContentfulArticle {
				edges {
					node {
						id
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
					}
				}
			}
		}
	`)

	const articles = _(data).get('allContentfulArticle.edges').map((entry) => entry.node)

	return (
		<Layout>
			<SEO title="Articles" />
			<Container>
				<Banner title={`Articles`} subtitle={`Explore`} />
				<ArticlesContainer articles={articles} />
			</Container>
		</Layout>
	)
}

export default Articles
