import React from 'react'
import Img from 'gatsby-image'
import styled from 'styled-components'
import RichTextRenderer from '../utils/richTextRenderer'
import linkResolver from '../utils/linkResolver'

import Layout from '../components/layout'
import Heading from '../components/Heading'

import _get from 'lodash/get'
import _map from 'lodash/map'
import _size from 'lodash/size'

const Article = styled.article`padding: 10px;`

const Hero = styled.div`
  background-image: url("${(props) => props.imageSrc}");
  background-position: center top;
  background-repeat: no-repeat;
  margin: 0px 0px 0px auto;
  min-height: 100px;
  width: 83%;
  height: 393.024px;
`

const TitleCard = styled.div`
	width: 58%;
	min-height: 192px;
	padding: 32px;
	margin: -64px auto 32px calc(8% + 32px);
	background: #fff;
`

const Content = styled.div`
	width: 55%;
	margin: 0px calc(8% + 32px) 36px auto;
`

const ArticleTemplate = ({ pageContext }) => {
	const { slug, title, subTitle, tags, heroImage, main } = pageContext || {}

	console.log({ slug, title, subTitle, tags, heroImage, main })

	return (
		<Layout>
			<Article>
				<Hero imageSrc={linkResolver(heroImage.file.url)} />
				<TitleCard>
					<Heading heading={1} variant={`primary`}>
						{title}
					</Heading>
					{subTitle && (
						<Heading heading={2} variant={`primary`}>
							{subTitle}
						</Heading>
					)}
					{!!_size(tags) && <p>{_map(tags, (tag) => tag.name).join(', ')}</p>}
				</TitleCard>
				<Content>{RichTextRenderer(main)}</Content>
			</Article>
		</Layout>
	)
}

export default ArticleTemplate
