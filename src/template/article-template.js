import React from 'react'
import Img from 'gatsby-image'
import styled, { css } from 'styled-components'
import richTextRenderer from '../utils/contentful'
import { getAssetType, getAssetSrc, getAssetTitle } from '../utils/contentful/helpers'

import Layout from '../components/layout'
import Heading from '../components/Heading'

import Hero from '../components/Article/Hero'

import _get from 'lodash/get'
import _map from 'lodash/map'
import _size from 'lodash/size'
import _join from 'lodash/join'

const Article = styled.article`padding: 10px;`

const TitleCard = styled.div`
	width: 58%;
	min-height: 192px;
	padding: 32px;
	/* margin: -64px auto 32px calc(8% + 32px); */
	margin: -64px auto 32px 8%;
	background: #fff;
`

const Content = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	> p,
	> h3,
	> h4,
	> h5,
	> h6,
	> ul,
	> ol,
	> blockquote {
		display: block;
		width: 55%;
		margin: 0px calc(8% + 32px) 36px auto;
	}

	> ul,
	> ol {
		padding-left: 19px;
	}

	a:after {
		background-color: ${({ color }) => color};
	}
	> blockquote {
		border-left: 2px solid ${({ color }) => color};
		padding-left: 25px;
		font-style: italic;
	}
	.article-image {
		${({ backgroundColor, gradient }) => {
			return css`
				background: ${backgroundColor};
				background: ${`linear-gradient(90deg, ${gradient.color1} 0%, ${gradient.color2} 35%, ${gradient.color3} 100%)`};
			`
		}};
		> img {
			width: initial;
		}
	}
`

const MetaContainer = styled.div`
	margin-top: 32px;
	> a {
		> span {
			position: relative;
			color: ${({ theme }) => theme.tertiary};
			&::after {
				content: "";
				position: absolute;
				bottom: 0;
				left: 0;
				height: 1px;
				width: 100%;
				background-color: ${({ theme }) => theme.tertiary};
				transform: scaleX(0);
				transform-origin: bottom left;
				transition: transform .3s ease-out, -webkit-transform .3s ease-out;
				will-change: transform;
			}
		}
		&:hover {
			> span {
				&::after {
					transform: scaleX(1);
				}
			}
		}
	}
`

const Meta = (tags) => {
	const renderTag = ({ id, name }) => {
		return (
			<Heading key={id} heading={`tag`} variant={`primary`} to={`category/${name}`}>
				<span>{name}</span>
			</Heading>
		)
	}

	const tagsArray = _map(tags, renderTag)

	const output = []
	tagsArray.forEach((tag, i) => {
		output.push(tag)
		if (tagsArray.length > 1 && i < tagsArray.length - 1) {
			output.push(', ')
		}
	})

	return <MetaContainer className="meta">{output}</MetaContainer>
}

const ArticleTemplate = ({ pageContext }) => {
	const { slug, title, subTitle, tags, colorBackground, colorPrimary, colorSecondary, bannerIcons, heroImage, main } =
		pageContext || {}

	return (
		<Layout>
			<Article>
				<Hero imageSrc={getAssetSrc(heroImage)} bannerIcons={bannerIcons} backgroundColor={colorBackground} />
				<TitleCard>
					<Heading heading={1} variant={`primary`}>
						{title}
					</Heading>
					{subTitle && (
						<Heading heading={2} variant={`primary`}>
							{subTitle}
						</Heading>
					)}
					{!!_size(tags) && <Meta {...tags} />}
				</TitleCard>
				<Content
					color={colorPrimary}
					backgroundColor={colorBackground}
					gradient={{ color1: colorBackground, color2: colorSecondary, color3: colorPrimary }}
				>
					{richTextRenderer(main)}
				</Content>
			</Article>
		</Layout>
	)
}

export default ArticleTemplate
