import React from 'react'
import { Link } from 'gatsby'
import _ from 'lodash'
import { useStaticQuery, graphql } from 'gatsby'

import Layout from '../components/layout'
import ArticleCard from '../components/Article/card'
import SEO from '../components/seo'
import Banner from '../components/Banner'
import styled from 'styled-components'

const ArticleList = styled.div`
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	align-items: stretch;
	margin-top: 64px;
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
	const articlesArray = _.get(data, 'allContentfulArticle.edges', [])

	return (
		<Layout>
			<SEO title="Articles" />
			<Banner
				title={`Articles`}
				subtitle={`I write about concepts I struggle to understand, to undestand them better.`}
			/>
			<ArticleList>{_.map(articlesArray, ({ node }, index) => <ArticleCard key={index} {...node} />)}</ArticleList>
		</Layout>
	)
}

export default Articles
