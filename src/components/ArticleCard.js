import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'
import linkResolver from '../utils/linkResolver'

import Heading from './heading'

const Article = styled.article`
	display: flex;
	flex-direction: column;
	flex: 0 0 50%;
	&:nth-child(odd) {
		padding-left: 12px;
	}
	&:nth-child(even) {
		padding-right: 12px;
	}
	&:first-child {
		flex: 0 0 100%;
		padding-left: 0;
		padding-right: 0;
		> .card-heading {
			width: 48%;
			min-height: 192px;
			padding: 32px;
			margin: -64px auto 32px calc(2%);
			background-color: ${({ theme }) => theme.secondary};
		}
	}
`

const Thumbnail = styled.div`
  width: 100%;
  height: 400px;
  display: block;
  background-image: url("${({ url }) => url}");
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
`

const Card = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	flex: 1;
	margin: 32px 0px;
`

const CardLink = styled(Link)`
	text-decoration: none;
	> h3 { padding-right: 5px; }
`

const ArticleCard = ({ id, slug, title, subTitle, tags, heroImage }) => (
	<Article key={id}>
		<Link to={`/articles/${slug}`}>
			<Thumbnail url={linkResolver(heroImage.file.url)} />
		</Link>
		<Card className={`card-heading`}>
			<CardLink to={`/articles/${slug}`}>
				<Heading heading={3} variant={`primary`}>
					{title}
				</Heading>
				<Heading heading={4} variant={`primary`}>
					{subTitle}
				</Heading>
			</CardLink>
		</Card>
	</Article>
)

export default ArticleCard
