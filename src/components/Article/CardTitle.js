import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'

import Heading from '../Heading'

import vars from '../../styles/vars'
import media from '../../styles/media'

const Wrapper = styled.div`
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

const CardTitle = ({ slug, title, subtitle }) => {
	return (
		<Wrapper className={`title-card`}>
			<CardLink to={`/articles/${slug}`}>
				<Heading heading={3} variant={`primary`}>
					{title}
				</Heading>
				<Heading heading={4} variant={`primary`}>
					{subtitle}
				</Heading>
			</CardLink>
		</Wrapper>
	)
}

export default CardTitle
