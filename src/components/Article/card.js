import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'
import _map from 'lodash/map'
import _size from 'lodash/size'
import { getAssetSrc } from '../../utils/contentful/helpers'

import CardTitle from './CardTitle'

import vars from '../../styles/vars'
import media from '../../styles/media'

const Article = styled.article`
	display: flex;
	flex-direction: column;
	flex: 0 0 100%;
	margin-bottom: 3rem;
	${media.greaterThan('tablet')`
		flex: 0 0 50%;
	`};
	${media.greaterThan('desktop')`
		flex: 0 0 50%;
	`};
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
		> .title-card {
			width: 100%;
			min-height: 192px;
			padding: 2rem 0;
			margin: 0;
			background-color: ${({ theme }) => theme.background};
			${media.greaterThan('tablet')`
				width: 84%;
				padding: 2rem 2rem;
				margin: -64px auto 2rem 2%;
			`};
			${media.greaterThan('desktop')`
				width: 48%;
				padding: 2rem 2rem;
				margin: -64px auto 2rem 2%;
			`};
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

const IconsWrapper = styled.div`
	width: 100%;
	height: 400px;
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	align-items: center;
	background-color: ${({ backgroundColor }) => backgroundColor};
`

const Icon = styled.img`
	width: auto;
	height: 100px;
`

const Card = ({
	id,
	slug,
	title,
	subTitle,
	tags,
	bannerIcons,
	colorBackground,
	colorPrimary,
	colorSecondary,
	heroImage
}) => {
	return (
		<Article key={id}>
			<Link to={`/articles/${slug}`}>
				{_size(bannerIcons) > 0 ? (
					<IconsWrapper backgroundColor={colorBackground}>
						{_map(bannerIcons, (icon) => {
							return <Icon src={getAssetSrc(icon)} />
						})}
					</IconsWrapper>
				) : (
					<Thumbnail url={getAssetSrc(heroImage)} />
				)}
			</Link>
			<CardTitle slug={slug} title={title} subtitle={subTitle} />
		</Article>
	)
}

export default Card
