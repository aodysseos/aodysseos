import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'
import _map from 'lodash/map'
import _size from 'lodash/size'
import { getAssetSrc } from '../../utils/contentful/helpers'

import Heading from '../Heading'

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
			background-color: ${({ theme }) => theme.background};
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

const Header = styled.div`
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
			<Header className={`card-heading`}>
				<CardLink to={`/articles/${slug}`}>
					<Heading heading={3} variant={`primary`}>
						{title}
					</Heading>
					<Heading heading={4} variant={`primary`}>
						{subTitle}
					</Heading>
				</CardLink>
			</Header>
		</Article>
	)
}

export default Card
